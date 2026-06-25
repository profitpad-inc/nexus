"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PurchaseOrder, POLine } from "@/lib/types";

interface ShelfOption { id: number; label: string; }

interface LineState {
  line_id:      number;
  qty_received: number;
  qty_damaged:  number;
  shelf_id:     number | null;
  notes:        string;
}

function varianceInfo(ordered: number, received: number) {
  const diff = received - ordered;
  if (diff < 0) return { label: `SHORT ${Math.abs(diff)}`, cls: "text-red-600 bg-red-50" };
  if (diff > 0) return { label: `OVER +${diff}`,           cls: "text-orange-600 bg-orange-50" };
  return { label: "OK", cls: "text-green-700 bg-green-50" };
}

export default function ReceivingForm({ po, branchId }: { po: PurchaseOrder; branchId: number }) {
  const router = useRouter();
  const [shelves, setShelves] = useState<ShelfOption[]>([]);
  const [lineStates, setLineStates] = useState<LineState[]>(
    po.lines.map((l) => ({
      line_id:      l.id,
      qty_received: l.qty_received ?? l.qty_ordered,
      qty_damaged:  l.qty_damaged  ?? 0,
      shelf_id:     l.shelf_id     ?? null,
      notes:        l.notes        ?? "",
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/shelves?branch_id=${branchId}`)
      .then((r) => r.json())
      .then(setShelves)
      .catch(() => {});
  }, [branchId]);

  function update(lineId: number, field: keyof LineState, value: any) {
    setLineStates((prev) =>
      prev.map((s) => (s.line_id === lineId ? { ...s, [field]: value } : s))
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/purchase-orders/${po.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lineStates, created_by: 3 }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail));
      }
      router.push("/purchase-orders");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Enter quantities received for each line. Flag any damaged units separately — they will not be added to sellable stock.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-right">Ordered</th>
              <th className="px-4 py-3 text-right w-28">Received</th>
              <th className="px-4 py-3 text-right w-24">Damaged</th>
              <th className="px-4 py-3 text-left w-36">Shelf</th>
              <th className="px-4 py-3 text-left w-24">Variance</th>
              <th className="px-4 py-3 text-left">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {po.lines.map((line) => {
              const state = lineStates.find((s) => s.line_id === line.id)!;
              const v     = varianceInfo(line.qty_ordered, state.qty_received);
              return (
                <tr key={line.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{line.sku}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="max-w-[200px] truncate">{line.product_name}</div>
                    {line.weight_kg && <div className="text-xs text-slate-400">{line.weight_kg} kg</div>}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 font-medium">{line.qty_ordered}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min={0}
                      value={state.qty_received}
                      onChange={(e) => update(line.id, "qty_received", Number(e.target.value))}
                      className="w-full text-right border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min={0}
                      value={state.qty_damaged}
                      onChange={(e) => update(line.id, "qty_damaged", Number(e.target.value))}
                      className="w-full text-right border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={state.shelf_id ?? ""}
                      onChange={(e) => update(line.id, "shelf_id", e.target.value ? Number(e.target.value) : null)}
                      className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">— shelf —</option>
                      {shelves.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${v.cls}`}>
                      {v.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text" placeholder="Optional"
                      value={state.notes}
                      onChange={(e) => update(line.id, "notes", e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-slate-500">
          {lineStates.some((s) => s.shelf_id === null) && (
            <span className="text-amber-600">⚠ Some lines have no shelf assigned</span>
          )}
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {submitting ? "Submitting…" : "Submit Receipt"}
        </button>
      </div>
    </div>
  );
}
