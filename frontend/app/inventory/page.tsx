import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const inventory = await api.inventory.list();

  const totalSkus  = inventory.length;
  const totalUnits = inventory.reduce((s: number, r: any) => s + r.qty_on_hand, 0);
  const lowStock   = inventory.filter((r: any) => r.qty_available <= 2).length;
  const damaged    = inventory.filter((r: any) => r.qty_damaged > 0).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-1">Live stock levels across all branches</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total SKUs",          value: totalSkus,  color: "text-slate-700" },
          { label: "Units on Hand",       value: totalUnits, color: "text-blue-600"  },
          { label: "SKUs Low / Zero",     value: lowStock,   color: "text-amber-600" },
          { label: "SKUs w/ Damage",      value: damaged,    color: "text-red-600"   },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 px-6 py-5">
            <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-sm text-slate-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">SKU</th>
              <th className="px-6 py-3 text-left">Product</th>
              <th className="px-6 py-3 text-left">Branch</th>
              <th className="px-6 py-3 text-left">Shelf</th>
              <th className="px-6 py-3 text-right">On Hand</th>
              <th className="px-6 py-3 text-right">Reserved</th>
              <th className="px-6 py-3 text-right">Available</th>
              <th className="px-6 py-3 text-right">Damaged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map((row: any) => {
              const lowAlert = row.qty_available <= 2;
              return (
                <tr key={row.id} className={`hover:bg-slate-50 ${lowAlert ? "bg-amber-50/40" : ""}`}>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{row.sku}</td>
                  <td className="px-6 py-3 text-slate-700 max-w-xs">
                    <div className="truncate">{row.name}</div>
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs">{row.branch}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{row.shelf ?? "—"}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-700">{row.qty_on_hand}</td>
                  <td className="px-6 py-3 text-right text-slate-500">{row.qty_reserved}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`font-semibold ${row.qty_available <= 0 ? "text-red-600" : row.qty_available <= 2 ? "text-amber-600" : "text-green-600"}`}>
                      {row.qty_available}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {row.qty_damaged > 0
                      ? <span className="font-semibold text-red-600">{row.qty_damaged}</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
