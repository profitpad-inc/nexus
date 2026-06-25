import { api } from "@/lib/api";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const STATUS_ORDER: Record<string, number> = {
  picking: 0, confirmed: 1, draft: 2, picked: 3, shipped: 4, cancelled: 5,
};

export default async function SalesOrdersPage() {
  const sos = await api.salesOrders.list();
  const sorted = [...sos].sort(
    (a: any, b: any) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sales Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Pick list and order management</p>
        </div>
        <Link
          href="/sales-orders/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Order
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">SO #</th>
              <th className="px-6 py-3 text-left">Customer</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Branch</th>
              <th className="px-6 py-3 text-left">Lines</th>
              <th className="px-6 py-3 text-left">Created</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((so: any) => (
              <tr key={so.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <Link href={`/sales-orders/${so.id}`} className="font-medium text-blue-600 hover:underline">
                    {so.so_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-700">{so.customer_name}</td>
                <td className="px-6 py-4">
                  <span className="text-xs capitalize text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {so.customer_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{so.branch_name}</td>
                <td className="px-6 py-4 text-slate-500">{so.lines?.length ?? 0}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {new Date(so.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td className="px-6 py-4"><StatusBadge status={so.status} /></td>
                <td className="px-6 py-4">
                  {["confirmed", "picking"].includes(so.status) && (
                    <Link href={`/sales-orders/${so.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-md hover:bg-amber-600 transition-colors">
                      Pick
                    </Link>
                  )}
                  {so.status === "draft" && (
                    <Link href={`/sales-orders/${so.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-600 text-white text-xs font-medium rounded-md hover:bg-slate-700 transition-colors">
                      Edit
                    </Link>
                  )}
                  {["picked", "shipped"].includes(so.status) && (
                    <Link href={`/sales-orders/${so.id}`} className="text-xs text-slate-400 hover:underline">View</Link>
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
