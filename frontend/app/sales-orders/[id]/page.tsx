import { api } from "@/lib/api";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import SalesOrderClient from "./SalesOrderClient";

export const dynamic = "force-dynamic";

export default async function SalesOrderPage({ params }: { params: { id: string } }) {
  const [so, products] = await Promise.all([
    api.salesOrders.get(Number(params.id)),
    api.products.list(),
  ]);

  const totalQty    = so.lines.reduce((s: number, l: any) => s + l.qty_ordered, 0);
  const pickedQty   = so.lines.reduce((s: number, l: any) => s + l.qty_picked, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/sales-orders" className="text-sm text-slate-500 hover:text-slate-700">
          ← Sales Orders
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-slate-900">{so.so_number}</h1>
            <StatusBadge status={so.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>
              <span className="font-medium text-slate-700">Customer:</span> {so.customer_name}
              <span className="ml-1.5 text-xs capitalize text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{so.customer_type}</span>
            </span>
            <span><span className="font-medium text-slate-700">Branch:</span> {so.branch_name}</span>
          </div>
          {so.notes && <p className="mt-2 text-sm text-slate-500 italic">{so.notes}</p>}
        </div>
        {so.status !== "draft" && (
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-700">
              {pickedQty}<span className="text-slate-400 text-lg">/{totalQty}</span>
            </div>
            <div className="text-xs text-slate-500">units picked</div>
          </div>
        )}
      </div>

      <SalesOrderClient so={so} products={products} />
    </div>
  );
}
