from fastapi import APIRouter, Query
from db import read_table

router = APIRouter(prefix="/api/shelves", tags=["shelves"])


@router.get("")
def list_shelves(branch_id: int = Query(default=None)):
    shelves  = read_table("shelves")
    aisles   = read_table("aisles")
    zones    = read_table("zones")

    if branch_id:
        branch_zones  = {z["id"] for z in zones  if z["branch_id"] == branch_id}
        branch_aisles = {a["id"] for a in aisles  if a["zone_id"] in branch_zones}
        shelves = [s for s in shelves if s["aisle_id"] in branch_aisles]

    aisle_map = {a["id"]: a for a in aisles}
    zone_map  = {z["id"]: z for z in zones}

    result = []
    for s in shelves:
        aisle = aisle_map.get(s["aisle_id"], {})
        zone  = zone_map.get(aisle.get("zone_id", 0), {})
        result.append({**s, "aisle_label": aisle.get("label"), "zone_name": zone.get("name"), "branch_id": zone.get("branch_id")})
    return sorted(result, key=lambda x: x["label"])
