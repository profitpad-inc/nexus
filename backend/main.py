from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import branches, products, inventory, purchase_orders, sales_orders, shelves

app = FastAPI(title="Nexus ERP — Hydrology Chicago", version="0.1.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(branches.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(purchase_orders.router)
app.include_router(sales_orders.router)
app.include_router(shelves.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "nexus-erp"}
