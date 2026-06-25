from fastapi import APIRouter, Query
from db import read_table, find_by_id

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


def _enrich(inv_row: dict, products: list, branches: list, shelves: list, product_locations: list) -> dict:
    product = next((p for p in products if p["id"] == inv_row["product_id"]), {})
    branch  = next((b for b in branches  if b["id"] == inv_row["branch_id"]),  {})
    primary_loc = next(
        (pl for pl in product_locations if pl["product_id"] == inv_row["product_id"] and pl["is_primary"]),
        None,
    )
    shelf = next((s for s in shelves if s["id"] == primary_loc["shelf_id"]), {}) if primary_loc else {}
    return {
        **inv_row,
        "qty_available": inv_row["qty_on_hand"] - inv_row["qty_reserved"],
        "sku":    product.get("sku"),
        "name":   product.get("name"),
        "branch": branch.get("name"),
        "shelf":  shelf.get("label"),
    }


@router.get("")
def list_inventory(branch_id: int = Query(default=None)):
    inv  = read_table("inventory")
    if branch_id:
        inv = [r for r in inv if r["branch_id"] == branch_id]
    products  = read_table("products")
    branches  = read_table("branches")
    shelves   = read_table("shelves")
    locations = read_table("product_locations")
    return [_enrich(r, products, branches, shelves, locations) for r in inv]


@router.get("/movements")
def list_movements(branch_id: int = Query(default=None), product_id: int = Query(default=None)):
    movements = read_table("inventory_movements")
    if branch_id:
        movements = [m for m in movements if m["branch_id"] == branch_id]
    if product_id:
        movements = [m for m in movements if m["product_id"] == product_id]
    products = read_table("products")
    users    = read_table("users")
    result = []
    for m in sorted(movements, key=lambda x: x["created_at"], reverse=True):
        product = next((p for p in products if p["id"] == m["product_id"]), {})
        user    = next((u for u in users    if u["id"] == m.get("created_by")), {})
        result.append({**m, "sku": product.get("sku"), "product_name": product.get("name"), "created_by_name": user.get("name")})
    return result
