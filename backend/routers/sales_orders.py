from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import read_table, write_table, find_by_id, update_by_id, insert

router = APIRouter(prefix="/api/sales-orders", tags=["sales-orders"])


def _shelf_for_product(product_id: int, locations: list, shelves: list) -> Optional[dict]:
    loc = next((l for l in locations if l["product_id"] == product_id and l["is_primary"]), None)
    if loc:
        return next((s for s in shelves if s["id"] == loc["shelf_id"]), None)
    return None


def _enrich_so(so: dict, lines: list, products: list, branches: list, locations: list, shelves: list, inventory: list) -> dict:
    branch   = next((b for b in branches if b["id"] == so["branch_id"]), {})
    so_lines = [l for l in lines if l["so_id"] == so["id"]]

    enriched_lines = []
    for line in so_lines:
        product   = next((p for p in products  if p["id"] == line["product_id"]), {})
        shelf     = _shelf_for_product(line["product_id"], locations, shelves)
        inv_row   = next((i for i in inventory if i["product_id"] == line["product_id"] and i["branch_id"] == so["branch_id"]), {})
        qty_avail = inv_row.get("qty_on_hand", 0) - inv_row.get("qty_reserved", 0)
        enriched_lines.append({
            **line,
            "sku":           product.get("sku"),
            "product_name":  product.get("name"),
            "shelf_label":   shelf["label"] if shelf else None,
            "shelf_id":      shelf["id"]    if shelf else None,
            "qty_available": qty_avail,
        })

    enriched_lines.sort(key=lambda l: (l.get("shelf_label") or "ZZZ", l["id"]))

    return {**so, "branch_name": branch.get("name"), "lines": enriched_lines}


@router.get("")
def list_sales_orders(branch_id: int = None, status: str = None):
    sos      = read_table("sales_orders")
    lines    = read_table("sales_order_lines")
    products = read_table("products")
    branches = read_table("branches")
    locations= read_table("product_locations")
    shelves  = read_table("shelves")
    inventory= read_table("inventory")
    if branch_id:
        sos = [s for s in sos if s["branch_id"] == branch_id]
    if status:
        sos = [s for s in sos if s["status"] == status]
    result = [_enrich_so(so, lines, products, branches, locations, shelves, inventory) for so in sos]
    return sorted(result, key=lambda s: s["created_at"], reverse=True)


@router.get("/{so_id}")
def get_sales_order(so_id: int):
    so = find_by_id("sales_orders", so_id)
    if not so:
        raise HTTPException(status_code=404, detail="SO not found")
    lines    = read_table("sales_order_lines")
    products = read_table("products")
    branches = read_table("branches")
    locations= read_table("product_locations")
    shelves  = read_table("shelves")
    inventory= read_table("inventory")
    return _enrich_so(so, lines, products, branches, locations, shelves, inventory)


class AddSOLine(BaseModel):
    product_id:  int
    qty_ordered: int


@router.post("/{so_id}/lines")
def add_line(so_id: int, payload: AddSOLine):
    so = find_by_id("sales_orders", so_id)
    if not so:
        raise HTTPException(status_code=404, detail="SO not found")
    if so["status"] not in ("draft",):
        raise HTTPException(status_code=400, detail="Can only add lines to draft orders")
    line = insert("sales_order_lines", {
        "so_id":       so_id,
        "product_id":  payload.product_id,
        "qty_ordered": payload.qty_ordered,
        "qty_picked":  0,
        "status":      "pending",
        "notes":       None,
    })
    return line


@router.delete("/{so_id}/lines/{line_id}")
def remove_line(so_id: int, line_id: int):
    so = find_by_id("sales_orders", so_id)
    if not so or so["status"] != "draft":
        raise HTTPException(status_code=400, detail="Can only remove lines from draft orders")
    lines    = read_table("sales_order_lines")
    new_lines = [l for l in lines if not (l["id"] == line_id and l["so_id"] == so_id)]
    write_table("sales_order_lines", new_lines)
    return {"success": True}


@router.post("/{so_id}/confirm")
def confirm_sales_order(so_id: int):
    so = find_by_id("sales_orders", so_id)
    if not so:
        raise HTTPException(status_code=404, detail="SO not found")
    if so["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft orders can be confirmed")

    lines     = read_table("sales_order_lines")
    inventory = read_table("inventory")
    so_lines  = [l for l in lines if l["so_id"] == so_id]

    if not so_lines:
        raise HTTPException(status_code=400, detail="Cannot confirm an order with no lines")

    errors = []
    for line in so_lines:
        inv_row = next((i for i in inventory if i["product_id"] == line["product_id"] and i["branch_id"] == so["branch_id"]), None)
        if not inv_row:
            errors.append({"product_id": line["product_id"], "issue": "No inventory record"})
            continue
        available = inv_row["qty_on_hand"] - inv_row["qty_reserved"]
        if available < line["qty_ordered"]:
            errors.append({
                "product_id":  line["product_id"],
                "qty_ordered": line["qty_ordered"],
                "qty_available": available,
                "issue": "Insufficient stock",
            })

    if errors:
        raise HTTPException(status_code=409, detail={"message": "Insufficient stock for some lines", "errors": errors})

    for line in so_lines:
        inv_row = next((i for i in inventory if i["product_id"] == line["product_id"] and i["branch_id"] == so["branch_id"]))
        inv_row["qty_reserved"] += line["qty_ordered"]
        line["status"] = "reserved"

    write_table("inventory", inventory)
    write_table("sales_order_lines", lines)
    update_by_id("sales_orders", so_id, {"status": "confirmed"})

    return {"success": True}


class PickLine(BaseModel):
    line_id:    int
    qty_picked: int
    notes:      Optional[str] = None


class PickPayload(BaseModel):
    lines:      list[PickLine]
    created_by: int = 3


@router.post("/{so_id}/pick")
def pick_sales_order(so_id: int, payload: PickPayload):
    so = find_by_id("sales_orders", so_id)
    if not so:
        raise HTTPException(status_code=404, detail="SO not found")
    if so["status"] not in ("confirmed", "picking"):
        raise HTTPException(status_code=400, detail="Order must be confirmed before picking")

    all_lines = read_table("sales_order_lines")
    inventory = read_table("inventory")
    movements = read_table("inventory_movements")
    locations = read_table("product_locations")
    shelves   = read_table("shelves")
    now       = datetime.now(timezone.utc).isoformat()

    so_lines = [l for l in all_lines if l["so_id"] == so_id]

    for pick in payload.lines:
        line = next((l for l in all_lines if l["id"] == pick.line_id and l["so_id"] == so_id), None)
        if not line:
            continue

        line["qty_picked"] = pick.qty_picked
        line["notes"]      = pick.notes

        if pick.qty_picked < line["qty_ordered"]:
            line["status"] = "short"
        else:
            line["status"] = "picked"

        inv_row = next((i for i in inventory if i["product_id"] == line["product_id"] and i["branch_id"] == so["branch_id"]), None)
        if inv_row and pick.qty_picked > 0:
            inv_row["qty_on_hand"]  -= pick.qty_picked
            inv_row["qty_reserved"] -= line["qty_ordered"]
            inv_row["qty_reserved"]  = max(inv_row["qty_reserved"], 0)

            shelf = _shelf_for_product(line["product_id"], locations, shelves)
            movements.append({
                "id":             max((m["id"] for m in movements), default=0) + 1,
                "product_id":     line["product_id"],
                "branch_id":      so["branch_id"],
                "shelf_id":       shelf["id"] if shelf else None,
                "delta":          -pick.qty_picked,
                "movement_type":  "pick",
                "reference_type": "sales_order",
                "reference_id":   so_id,
                "notes":          pick.notes,
                "created_by":     payload.created_by,
                "created_at":     now,
            })

    all_picked  = all(l["status"] in ("picked", "short") for l in so_lines)
    new_status  = "picked" if all_picked else "picking"
    update_by_id("sales_orders", so_id, {"status": new_status})

    write_table("sales_order_lines", all_lines)
    write_table("inventory", inventory)
    write_table("inventory_movements", movements)

    return {"success": True, "so_status": new_status}


class CreateSO(BaseModel):
    customer_name:  str
    customer_type:  str = "trade"
    branch_id:      int = 1
    notes:          Optional[str] = None
    created_by:     int = 1


@router.post("")
def create_sales_order(payload: CreateSO):
    sos  = read_table("sales_orders")
    year = datetime.now().year
    existing_this_year = [s for s in sos if str(year) in s["so_number"]]
    seq  = len(existing_this_year) + 1
    so_number = f"SO-{year}-{seq:03d}"

    so = insert("sales_orders", {
        "so_number":     so_number,
        "customer_name": payload.customer_name,
        "customer_type": payload.customer_type,
        "status":        "draft",
        "branch_id":     payload.branch_id,
        "created_by":    payload.created_by,
        "created_at":    datetime.now(timezone.utc).isoformat(),
        "notes":         payload.notes,
    })
    return so
