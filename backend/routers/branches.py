from fastapi import APIRouter
from db import read_table, find_by_id

router = APIRouter(prefix="/api/branches", tags=["branches"])


@router.get("")
def list_branches():
    return read_table("branches")


@router.get("/{branch_id}")
def get_branch(branch_id: int):
    return find_by_id("branches", branch_id)
