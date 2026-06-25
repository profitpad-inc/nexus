from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import read_table, write_table, find_by_id, update_by_id, insert, next_id

router = APIRouter(prefix="/api/purchase-orders", tags=["purchase-orders"])


def _enrich_po(po: dict, lines: list, products: list, branches: list, shelves: list) -> dict:
    branch = next((b for b in branches if b["id"] == po["branch_id"]), {})
    po_lines = [l for l in lines if l["po_id"] == po["id"]]
    enriched_lines = []
    for line in po_lines:
        product = next((p for p in products if p["id"] == line["product_id"]), {})
        shelf   = next((s for s in shelves   if s["id"] == line.get("shelf_id")), None)
        enriched_lines.append({
            **line,
            "sku":          product.get("sku"),
            "product_name": product.get("name"),
            "weight_kg":    product.get("weight_kg"),
            "shelf_label":  shelf["label"] if shelf else None,
        })
    return {
        **po,
        "branch_name": branch.get("name"),
        "lines": sorted(enriched_lines, key=lambda l: l["id"]),
    }


@router.get("")
def list_purchase_orders(branch_id: int = None, status: str = None):
    pos      = read_table("purchase_orders")
    lines    = read_table("purchase_order_lines")
    products = read_table("products")
    branches = read_table("branches")
    shelves  = read_table("shelves")
    if branch_id:
        pos = [p for p in pos if p["branch_id"] == branch_id]
    if status:
        pos = [p for p in pos if p["status"] == status]
    result = [_enrich_po(po, lines, products, branches, shelves) for po in pos]
    return sorted(result, key=lambda p: p["created_at"], reverse=True)


@router.get("/{po_id}")
def get_purchase_order(po_id: int):
    po = find_by_id("purchase_orders", po_id)
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    lines    = read_table("purchase_order_lines")
    products = read_table("products")
    branches = read_table("branches")
    shelves  = read_table("shelves")
    return _enrich_po(po, lines, products, branches, shelves)


class ReceiveLine(BaseModel):
    line_id:      int
    qty_received: int
    qty_damaged:  int = 0
    shelf_id:     Optional[int] = None
    notes:        Optional[str] = None


class ReceivePayload(BaseModel):
    lines:      list[ReceiveLine]
    created_by: int = 3


@router.post("/{po_id}/receive")
def receive_purchase_order(po_id: int, payload: ReceivePayload):
    po = find_by_id("purchase_orders", po_id)
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po["status"] not in ("open", "receiving"):
        raise HTTPException(status_code=400, detail=f"PO status is '{po['status']}' — cannot receive")

    all_lines    = read_table("purchase_order_lines")
    inventory    = read_table("inventory")
    movements    = read_table("inventory_movements")
    locations    = read_table("product_locations")
    now          = datetime.now(timezone.utc).isoformat()

    for recv in payload.lines:
        line = next((l for l in all_lines if l["id"] == recv.line_id), None)
        if not line or line["po_id"] != po_id:
            continue

        line["qty_received"] = recv.qty_received
        line["qty_damaged"]  = recv.qty_damaged
        line["shelf_id"]     = recv.shelf_id
        line["notes"]        = recv.notes

        short = recv.qty_received < line["qty_ordered"]
        over  = recv.qty_received > line["qty_ordered"]
        if recv.qty_received == line["qty_ordered"] and recv.qty_damaged == 0:
            line["status"] = "received"
        elif short:
            line["status"] = "short"
        elif over:
            line["status"] = "over"
        else:
            line["status"] = "received"

        net_good = recv.qty_received - recv.qty_damaged
        branch_id   = po["branch_id"]
        product_id  = line["product_id"]

        inv_row = next((i for i in inventory if i["product_id"] == product_id and i["branch_id"] == branch_id), None)
        if inv_row:
            inv_row["qty_on_hand"] += net_good
            inv_row["qty_damaged"] += recv.qty_damaged
        else:
            new_inv = {
                "id": max((i["id"] for i in inventory), default=0) + 1,
                "product_id": product_id, "branch_id": branch_id,
                "qty_on_hand": net_good, "qty_reserved": 0,
                "qty_in_transit": 0, "qty_damaged": recv.qty_damaged,
            }
            inventory.append(new_inv)

        if net_good > 0:
            movements.append({
                "id":             max((m["id"] for m in movements), default=0) + 1,
                "product_id":     product_id,
                "branch_id":      branch_id,
                "shelf_id":       recv.shelf_id,
                "delta":          net_good,
                "movement_type":  "receive",
                "reference_type": "po",
                "reference_id":   po_id,
                "notes":          recv.notes,
                "created_by":     payload.created_by,
                "created_at":     now,
            })
        if recv.qty_damaged > 0:
            movements.append({
                "id":             max((m["id"] for m in movements), default=0) + 1,
                "product_id":     product_id,
                "branch_id":      branch_id,
                "shelf_id":       recv.shelf_id,
                "delta":          recv.qty_damaged,
                "movement_type":  "damage",
                "reference_type": "po",
                "reference_id":   po_id,
                "notes":          f"Damaged on receipt",
                "created_by":     payload.created_by,
                "created_at":     now,
            })

        if recv.shelf_id:
            existing_loc = next(
                (l for l in locations if l["product_id"] == product_id and l["shelf_id"] == recv.shelf_id),
                None,
            )
            if not existing_loc:
                locations.append({
                    "id":         max((l["id"] for l in locations), default=0) + 1,
                    "product_id": product_id,
                    "shelf_id":   recv.shelf_id,
                    "is_primary": not any(l for l in locations if l["product_id"] == product_id and l["is_primary"]),
                })

    all_received = all(l["status"] in ("received", "short", "over") for l in all_lines if l["po_id"] == po_id)
    po["status"] = "received" if all_received else "receiving"

    write_table("purchase_order_lines", all_lines)
    write_table("inventory", inventory)
    write_table("inventory_movements", movements)
    write_table("product_locations", locations)
    update_by_id("purchase_orders", po_id, {"status": po["status"]})

    return {"success": True, "po_status": po["status"]}


class CreatePOLine(BaseModel):
    product_id:  int
    qty_ordered: int


class CreatePO(BaseModel):
    supplier:      str
    expected_date: str
    branch_id:     int
    notes:         Optional[str] = None
    created_by:    int = 1
    lines:         list[CreatePOLine] = []


@router.post("")
def create_purchase_order(payload: CreatePO):
    pos = read_table("purchase_orders")
    year = datetime.now().year
    existing_this_year = [p for p in pos if str(year) in p["po_number"]]
    seq = len(existing_this_year) + 1
    po_number = f"PO-{year}-{seq:03d}"

    po = insert("purchase_orders", {
        "po_number":     po_number,
        "supplier":      payload.supplier,
        "expected_date": payload.expected_date,
        "status":        "open",
        "branch_id":     payload.branch_id,
        "created_by":    payload.created_by,
        "created_at":    datetime.now(timezone.utc).isoformat(),
        "notes":         payload.notes,
    })

    for line in payload.lines:
        insert("purchase_order_lines", {
            "po_id":        po["id"],
            "product_id":   line.product_id,
            "qty_ordered":  line.qty_ordered,
            "qty_received": 0,
            "qty_damaged":  0,
            "shelf_id":     None,
            "status":       "pending",
            "notes":        None,
        })

    return po
