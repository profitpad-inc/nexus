from fastapi import APIRouter, Query
from db import read_table, find_by_id

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
def list_products(q: str = Query(default=""), active_only: bool = True):
    products = read_table("products")
    if active_only:
        products = [p for p in products if p.get("is_active")]
    if q:
        q_lower = q.lower()
        products = [
            p for p in products
            if q_lower in p["sku"].lower() or q_lower in p["name"].lower()
        ]
    return products


@router.get("/{product_id}")
def get_product(product_id: int):
    return find_by_id("products", product_id)
