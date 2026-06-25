# Nexus ERP

Warehouse and distribution ERP built for [Hydrology Chicago](https://hydrologychicago.com) — a high-end bath and plumbing fixtures showroom/distributor. ProfitPad retains IP and will productize this for other distributors replacing legacy Eclipse/Epicor systems.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL — currently mocked with `nexus_db/` JSON files |
| Auth | Clerk / Supabase Auth (not yet wired) |
| CRM sync | HubSpot via n8n |
| Hosting | GCP |

## Getting started

**Prerequisites:** Python 3.9+, Node.js 18+

```bash
# Install backend deps
cd backend && pip install -r requirements.txt

# Install frontend deps
cd frontend && npm install

# Start both servers
cd .. && ./start.sh
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Project structure

```
nexus_db/          # JSON file database (replaces Postgres during development)
│  branches.json   products.json        purchase_orders.json
│  zones.json      product_locations.json purchase_order_lines.json
│  aisles.json     inventory.json       sales_orders.json
│  shelves.json    inventory_movements.json sales_order_lines.json
│  users.json
│
backend/
│  main.py         # FastAPI app entry point
│  db.py           # JSON file read/write utilities
│  routers/
│    branches.py · products.py · inventory.py · shelves.py
│    purchase_orders.py · sales_orders.py
│
frontend/
│  app/
│    page.tsx                          # Dashboard
│    purchase-orders/                  # Receiving workflow
│    sales-orders/                     # Sales order + pick workflow
│    inventory/                        # Stock levels view
│  components/
│    Sidebar.tsx · StatusBadge.tsx
│  lib/
│    api.ts · types.ts
```

## Core workflows

### Receiving (POs)
`/purchase-orders` → open a PO → enter qty received, qty damaged, shelf assignment per line → submit → inventory updated, movements logged

### Sales & Picking
`/sales-orders` → create order → add SKUs (with live availability check) → confirm (reserves stock) → pick list sorted by shelf → complete pick → inventory decremented

### Inventory
`/inventory` — live stock levels with on-hand / reserved / available / damaged columns

## Database

The `nexus_db/` JSON files act as a flat-file Postgres substitute. The schema matches the SQL in the project brief exactly — migration is a matter of swapping `db.py` for a real Postgres connection.

**Note:** The JSON files mutate in real time as the backend runs (just like a real DB). Treat them as your dev database.

## Multi-tenancy plan

Schema-per-tenant. Feature flags from day one. White-label theming configurable per client.

## Seed data

The database ships with realistic Hydrology-style data:
- **20 SKUs** across Kohler, Waterworks, Hansgrohe, Grohe, Toto, Duravit, Victoria+Albert, Robern — with finish/size/config variants (the real reason SKU counts balloon)
- **2 branches** (Chicago Main, Chicago North), 4 zones, 9 aisles, 20 shelves
- **4 purchase orders** (1 received, 2 open/ready to receive, 1 draft)
- **3 sales orders** (1 picked, 1 confirmed/ready to pick, 1 draft)
