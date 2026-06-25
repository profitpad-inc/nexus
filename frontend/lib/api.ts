const BASE = "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export const api = {
  branches: {
    list: () => req<any[]>("/api/branches"),
  },
  products: {
    list: (q?: string) => req<any[]>(`/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    get:  (id: number) => req<any>(`/api/products/${id}`),
  },
  inventory: {
    list:      (branchId?: number) => req<any[]>(`/api/inventory${branchId ? `?branch_id=${branchId}` : ""}`),
    movements: (branchId?: number) => req<any[]>(`/api/inventory/movements${branchId ? `?branch_id=${branchId}` : ""}`),
  },
  purchaseOrders: {
    list:    (params?: { branch_id?: number; status?: string }) =>
      req<any[]>(`/api/purchase-orders${params?.status ? `?status=${params.status}` : ""}`),
    get:     (id: number)         => req<any>(`/api/purchase-orders/${id}`),
    receive: (id: number, body: any) => req<any>(`/api/purchase-orders/${id}/receive`, { method: "POST", body: JSON.stringify(body) }),
    create:  (body: any)          => req<any>("/api/purchase-orders", { method: "POST", body: JSON.stringify(body) }),
  },
  salesOrders: {
    list:    (params?: { branch_id?: number; status?: string }) =>
      req<any[]>("/api/sales-orders"),
    get:     (id: number)         => req<any>(`/api/sales-orders/${id}`),
    create:  (body: any)          => req<any>("/api/sales-orders", { method: "POST", body: JSON.stringify(body) }),
    addLine: (id: number, body: any) => req<any>(`/api/sales-orders/${id}/lines`, { method: "POST", body: JSON.stringify(body) }),
    removeLine: (soId: number, lineId: number) => req<any>(`/api/sales-orders/${soId}/lines/${lineId}`, { method: "DELETE" }),
    confirm: (id: number)         => req<any>(`/api/sales-orders/${id}/confirm`, { method: "POST" }),
    pick:    (id: number, body: any) => req<any>(`/api/sales-orders/${id}/pick`, { method: "POST", body: JSON.stringify(body) }),
  },
};
