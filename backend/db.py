from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Optional

DB_PATH = Path(__file__).parent.parent / "nexus_db"


def read_table(table: str) -> list:
    path = DB_PATH / f"{table}.json"
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)


def write_table(table: str, data: list) -> None:
    path = DB_PATH / f"{table}.json"
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)


def next_id(table: str) -> int:
    rows = read_table(table)
    return max((r["id"] for r in rows), default=0) + 1


def find_by_id(table: str, id: int) -> Optional[dict]:
    return next((r for r in read_table(table) if r["id"] == id), None)


def update_by_id(table: str, id: int, updates: dict) -> Optional[dict]:
    rows = read_table(table)
    for row in rows:
        if row["id"] == id:
            row.update(updates)
            write_table(table, rows)
            return row
    return None


def insert(table: str, record: dict) -> dict:
    rows = read_table(table)
    record["id"] = next_id(table)
    rows.append(record)
    write_table(table, rows)
    return record


def delete_by_id(table: str, id: int) -> bool:
    rows = read_table(table)
    new_rows = [r for r in rows if r["id"] != id]
    if len(new_rows) == len(rows):
        return False
    write_table(table, new_rows)
    return True
