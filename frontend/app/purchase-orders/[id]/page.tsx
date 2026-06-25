import { api } from "@/lib/api";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ReceivingForm from "./ReceivingForm";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderPage({ params }: { params: { id: string } }) {
  const po = await api.purchaseOrders.get(Number(params.id));
  const canReceive = ["open", "receiving"].includes(po.status);
  const totalOrdered  = po.lines.reduce((s: number, l: any) => s + l.qty_ordered, 0);
  const totalReceived = po.lines.reduce((s: number, l: any) => s + l.qty_received, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/purchase-orders" className="text-sm text-slate-500 hover:text-slate-700">
          ← Purchase Orders
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-slate-900">{po.po_number}</h1>
            <StatusBadge status={po.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span><span className="font-medium text-slate-700">Supplier:</span> {po.supplier}</span>
            <span><span className="font-medium text-slate-700">Branch:</span> {po.branch_name}</span>
            <span><span className="font-medium text-slate-700">Expected:</span> {po.expected_date}</span>
          </div>
          {po.notes && <p className="mt-2 text-sm text-slate-500 italic">{po.notes}</p>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-700">
            {totalReceived}
            <span className="text-slate-400 text-lg">/{totalOrdered}</span>
          </div>
          <div className="text-xs text-slate-500">units received</div>
        </div>
      </div>

      {canReceive ? (
        <ReceivingForm po={po} branchId={po.branch_id} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">SKU</th>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-right">Ordered</th>
                <th className="px-6 py-3 text-right">Received</th>
                <th className="px-6 py-3 text-right">Damaged</th>
                <th className="px-6 py-3 text-left">Shelf</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.lines.map((line: any) => (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{line.sku}</td>
                  <td className="px-6 py-3 text-slate-700">{line.product_name}</td>
                  <td className="px-6 py-3 text-right text-slate-600">{line.qty_ordered}</td>
                  <td className="px-6 py-3 text-right font-semibold text-slate-800">{line.qty_received}</td>
                  <td className="px-6 py-3 text-right text-red-600">{line.qty_damaged > 0 ? line.qty_damaged : "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{line.shelf_label ?? "—"}</td>
                  <td className="px-6 py-3"><StatusBadge status={line.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
