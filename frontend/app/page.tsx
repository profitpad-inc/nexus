import { api } from "@/lib/api";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [pos, sos, inventory] = await Promise.all([
    api.purchaseOrders.list(),
    api.salesOrders.list(),
    api.inventory.list(1),
  ]);

  const openPos    = pos.filter((p: any) => ["open", "receiving"].includes(p.status));
  const activeSos  = sos.filter((s: any) => ["confirmed", "picking"].includes(s.status));
  const lowStock   = inventory.filter((i: any) => i.qty_available <= 2 && i.qty_on_hand > 0);
  const recentMoves = await api.inventory.movements(1);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Chicago Main Branch · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Open POs",           value: openPos.length,   href: "/purchase-orders",  color: "text-blue-600"  },
          { label: "Orders to Pick",     value: activeSos.length, href: "/sales-orders",     color: "text-amber-600" },
          { label: "SKUs Low Stock",     value: lowStock.length,  href: "/inventory",        color: "text-red-600"   },
          { label: "Total SKUs on Hand", value: inventory.length, href: "/inventory",        color: "text-slate-700" },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href}
            className="bg-white rounded-xl border border-slate-200 px-6 py-5 hover:border-blue-300 transition-colors">
            <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-sm text-slate-500 mt-1">{kpi.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Inbound POs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Inbound — Open POs</h2>
            <Link href="/purchase-orders" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {openPos.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No open POs</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-2.5 text-left">PO #</th>
                  <th className="px-6 py-2.5 text-left">Supplier</th>
                  <th className="px-6 py-2.5 text-left">Expected</th>
                  <th className="px-6 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openPos.slice(0, 5).map((po: any) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link href={`/purchase-orders/${po.id}`} className="font-medium text-blue-600 hover:underline">
                        {po.po_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{po.supplier}</td>
                    <td className="px-6 py-3 text-slate-500">{po.expected_date}</td>
                    <td className="px-6 py-3"><StatusBadge status={po.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Orders to pick */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Outbound — Orders to Pick</h2>
            <Link href="/sales-orders" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {activeSos.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No orders awaiting pick</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-2.5 text-left">SO #</th>
                  <th className="px-6 py-2.5 text-left">Customer</th>
                  <th className="px-6 py-2.5 text-left">Lines</th>
                  <th className="px-6 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSos.slice(0, 5).map((so: any) => (
                  <tr key={so.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link href={`/sales-orders/${so.id}`} className="font-medium text-blue-600 hover:underline">
                        {so.so_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{so.customer_name}</td>
                    <td className="px-6 py-3 text-slate-500">{so.lines?.length ?? 0}</td>
                    <td className="px-6 py-3"><StatusBadge status={so.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Low Stock Alerts</h2>
            <Link href="/inventory" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No low stock alerts</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-2.5 text-left">SKU</th>
                  <th className="px-6 py-2.5 text-left">Product</th>
                  <th className="px-6 py-2.5 text-right">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStock.slice(0, 5).map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{row.sku}</td>
                    <td className="px-6 py-3 text-slate-700 max-w-xs truncate">{row.name}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-semibold text-red-600">{row.qty_available}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent movements */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Movements</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-2.5 text-left">Type</th>
                <th className="px-6 py-2.5 text-left">SKU</th>
                <th className="px-6 py-2.5 text-right">Δ Qty</th>
                <th className="px-6 py-2.5 text-left">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentMoves.slice(0, 6).map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      m.movement_type === "receive" ? "bg-green-50 text-green-700" :
                      m.movement_type === "pick"    ? "bg-blue-50 text-blue-700" :
                      m.movement_type === "damage"  ? "bg-red-50 text-red-600" :
                      "bg-slate-100 text-slate-600"
                    }`}>{m.movement_type}</span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{m.sku}</td>
                  <td className={`px-6 py-3 text-right font-semibold ${m.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                    {m.delta > 0 ? "+" : ""}{m.delta}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{m.created_by_name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
