import { api } from "@/lib/api";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage() {
  const pos = await api.purchaseOrders.list();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Receiving workflow — open and in-progress</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">PO Number</th>
              <th className="px-6 py-3 text-left">Supplier</th>
              <th className="px-6 py-3 text-left">Branch</th>
              <th className="px-6 py-3 text-left">Expected</th>
              <th className="px-6 py-3 text-left">Lines</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pos.map((po: any) => (
              <tr key={po.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <Link href={`/purchase-orders/${po.id}`} className="font-medium text-blue-600 hover:underline">
                    {po.po_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-700">{po.supplier}</td>
                <td className="px-6 py-4 text-slate-500">{po.branch_name}</td>
                <td className="px-6 py-4 text-slate-500">{po.expected_date}</td>
                <td className="px-6 py-4 text-slate-500">{po.lines?.length ?? 0}</td>
                <td className="px-6 py-4"><StatusBadge status={po.status} /></td>
                <td className="px-6 py-4">
                  {["open", "receiving"].includes(po.status) && (
                    <Link href={`/purchase-orders/${po.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors">
                      Receive
                    </Link>
                  )}
                  {po.status === "received" && (
                    <span className="text-xs text-slate-400">Completed</span>
                  )}
                  {po.status === "draft" && (
                    <Link href={`/purchase-orders/${po.id}`}
                      className="text-xs text-slate-500 hover:underline">View</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
