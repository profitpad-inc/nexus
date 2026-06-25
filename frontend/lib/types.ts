export interface Branch {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  unit_of_measure: string;
  units_per_case?: number;
  weight_kg?: number;
  is_active: boolean;
}

export interface Shelf {
  id: number;
  aisle_id: number;
  label: string;
  capacity?: number;
}

export interface InventoryRow {
  id: number;
  product_id: number;
  branch_id: number;
  qty_on_hand: number;
  qty_reserved: number;
  qty_in_transit: number;
  qty_damaged: number;
  qty_available: number;
  sku?: string;
  name?: string;
  branch?: string;
  shelf?: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  branch_id: number;
  shelf_id?: number;
  delta: number;
  movement_type: string;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_by?: number;
  created_at: string;
  sku?: string;
  product_name?: string;
  created_by_name?: string;
}

export interface POLine {
  id: number;
  po_id: number;
  product_id: number;
  qty_ordered: number;
  qty_received: number;
  qty_damaged: number;
  shelf_id?: number;
  status: "pending" | "received" | "short" | "over";
  notes?: string;
  sku?: string;
  product_name?: string;
  shelf_label?: string;
  weight_kg?: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: string;
  expected_date: string;
  status: "draft" | "open" | "receiving" | "received" | "closed";
  branch_id: number;
  created_by: number;
  created_at: string;
  notes?: string;
  branch_name?: string;
  lines: POLine[];
}

export interface SOLine {
  id: number;
  so_id: number;
  product_id: number;
  qty_ordered: number;
  qty_picked: number;
  status: "pending" | "reserved" | "picked" | "short";
  notes?: string;
  sku?: string;
  product_name?: string;
  shelf_label?: string;
  shelf_id?: number;
  qty_available?: number;
}

export interface SalesOrder {
  id: number;
  so_number: string;
  customer_name: string;
  customer_type: string;
  status: "draft" | "confirmed" | "picking" | "picked" | "shipped" | "cancelled";
  branch_id: number;
  created_by: number;
  created_at: string;
  notes?: string;
  branch_name?: string;
  lines: SOLine[];
}
