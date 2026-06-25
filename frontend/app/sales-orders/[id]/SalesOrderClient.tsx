"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { SalesOrder, SOLine, Product } from "@/lib/types";

interface PickState {
  line_id:    number;
  qty_picked: number;
  notes:      string;
}

// ─── Draft: Add/remove lines ─────────────────────────────────────────────────
function DraftPanel({ so, products }: { so: SalesOrder; products: Product[] }) {
  const router = useRouter();
  const [search, setSearch]   = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [qty, setQty]         = useState(1);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function searchProducts(q: string) {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`http://localhost:8000/api/products?q=${encodeURIComponent(q)}`).then((r) => r.json());
    setResults(res.slice(0, 8));
  }

  async function addLine() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/sales-orders/${so.id}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: selected.id, qty_ordered: qty }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed");
      setSelected(null);
      setSearch("");
      setResults([]);
      setQty(1);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeLine(lineId: number) {
    await fetch(`http://localhost:8000/api/sales-orders/${so.id}/lines/${lineId}`, { method: "DELETE" });
    router.refresh();
  }

  async function confirm() {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/sales-orders/${so.id}/confirm`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        if (body.detail?.errors) {
          const msgs = body.detail.errors.map((e: any) => `${e.issue} (ordered ${e.qty_ordered}, available ${e.qty_available})`);
          throw new Error(msgs.join("; "));
        }
        throw new Error(body.detail ?? "Failed to confirm");
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Add product search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="text-sm font-medium text-slate-700 mb-3">Add Product</div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by SKU or product name…"
              value={search}
              onChange={(e) => searchProducts(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {results.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelected(p); setSearch(p.name); setResults([]); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0"
                  >
                    <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                    <div className="text-sm text-slate-700 truncate">{p.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="number" min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={addLine}
            disabled={!selected || loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Lines table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {so.lines.length === 0 ? (
          <p className="px-6 py-10 text-sm text-slate-400 text-center">No lines added yet. Search for products above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">SKU</th>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Available</th>
                <th className="px-6 py-3 text-left">Shelf</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {so.lines.map((line: any) => (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{line.sku}</td>
                  <td className="px-6 py-3 text-slate-700">{line.product_name}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-800">{line.qty_ordered}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`font-semibold ${(line.qty_available ?? 0) >= line.qty_ordered ? "text-green-600" : "text-red-600"}`}>
                      {line.qty_available ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{line.shelf_label ?? "—"}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => removeLine(line.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {so.lines.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={confirm}
            disabled={confirming}
            className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
          >
            {confirming ? "Reserving stock…" : "Confirm & Reserve Stock →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Confirmed / Picking: Pick list ──────────────────────────────────────────
function PickPanel({ so }: { so: SalesOrder }) {
  const router  = useRouter();
  const [states, setStates] = useState<PickState[]>(
    so.lines.map((l) => ({
      line_id:    l.id,
      qty_picked: l.qty_picked ?? l.qty_ordered,
      notes:      l.notes ?? "",
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function update(lineId: number, field: keyof PickState, value: any) {
    setStates((prev) => prev.map((s) => (s.line_id === lineId ? { ...s, [field]: value } : s)));
  }

  async function submitPick() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/sales-orders/${so.id}/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: states, created_by: 3 }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed");
      router.push("/sales-orders");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const sortedLines = [...so.lines].sort((a, b) =>
    (a.shelf_label ?? "ZZZ").localeCompare(b.shelf_label ?? "ZZZ")
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        Pick list sorted by shelf location. Enter actual qty picked for each line. Flag short picks — they will trigger backorder.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left w-24">Shelf</th>
              <th className="px-6 py-3 text-left">SKU</th>
              <th className="px-6 py-3 text-left">Product</th>
              <th className="px-6 py-3 text-right">Required</th>
              <th className="px-6 py-3 text-right w-28">Picked</th>
              <th className="px-6 py-3 text-left">Flag</th>
              <th className="px-6 py-3 text-left">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedLines.map((line: any) => {
              const state = states.find((s) => s.line_id === line.id)!;
              const short = state.qty_picked < line.qty_ordered;
              return (
                <tr key={line.id} className={`hover:bg-slate-50/50 ${short ? "bg-red-50/30" : ""}`}>
                  <td className="px-6 py-3">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      {line.shelf_label ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{line.sku}</td>
                  <td className="px-6 py-3 text-slate-700 max-w-xs truncate">{line.product_name}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-800">{line.qty_ordered}</td>
                  <td className="px-6 py-3">
                    <input
                      type="number" min={0}
                      value={state.qty_picked}
                      onChange={(e) => update(line.id, "qty_picked", Number(e.target.value))}
                      className={`w-full text-right border rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2 ${
                        short
                          ? "border-red-300 focus:ring-red-400 bg-red-50"
                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </td>
                  <td className="px-6 py-3">
                    {short && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600">
                        SHORT {line.qty_ordered - state.qty_picked}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
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

      <div className="flex justify-end">
        <button
          onClick={submitPick}
          disabled={submitting}
          className="px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm"
        >
          {submitting ? "Submitting…" : "Complete Pick →"}
        </button>
      </div>
    </div>
  );
}

// ─── Read-only view ───────────────────────────────────────────────────────────
function ReadOnlyLines({ lines }: { lines: SOLine[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-xs text-slate-500 uppercase tracking-wide">
            <th className="px-6 py-3 text-left">Shelf</th>
            <th className="px-6 py-3 text-left">SKU</th>
            <th className="px-6 py-3 text-left">Product</th>
            <th className="px-6 py-3 text-right">Ordered</th>
            <th className="px-6 py-3 text-right">Picked</th>
            <th className="px-6 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((line: any) => (
            <tr key={line.id} className="hover:bg-slate-50">
              <td className="px-6 py-3 font-mono text-xs text-slate-500">{line.shelf_label ?? "—"}</td>
              <td className="px-6 py-3 font-mono text-xs text-slate-500">{line.sku}</td>
              <td className="px-6 py-3 text-slate-700">{line.product_name}</td>
              <td className="px-6 py-3 text-right text-slate-600">{line.qty_ordered}</td>
              <td className="px-6 py-3 text-right font-semibold text-slate-800">{line.qty_picked}</td>
              <td className="px-6 py-3"><StatusBadge status={line.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function SalesOrderClient({ so, products }: { so: SalesOrder; products: Product[] }) {
  return (
    <>
      {so.status === "draft"     && <DraftPanel so={so} products={products} />}
      {["confirmed", "picking"].includes(so.status) && <PickPanel so={so} />}
      {["picked", "shipped", "cancelled"].includes(so.status) && <ReadOnlyLines lines={so.lines} />}
    </>
  );
}
