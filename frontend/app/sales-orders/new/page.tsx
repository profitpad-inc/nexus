"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customer_name: "",
    customer_type: "trade",
    branch_id: 1,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_name.trim()) { setError("Customer name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, created_by: 1 }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed");
      const so = await res.json();
      router.push(`/sales-orders/${so.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/sales-orders" className="text-sm text-slate-500 hover:text-slate-700">← Sales Orders</Link>
      </div>

      <h1 className="text-2xl font-semibold text-slate-900 mb-6">New Sales Order</h1>

      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Name</label>
          <input
            type="text"
            placeholder="e.g. Studio McGee Design"
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Type</label>
          <select
            value={form.customer_type}
            onChange={(e) => setForm((f) => ({ ...f, customer_type: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="trade">Trade</option>
            <option value="designer">Designer</option>
            <option value="retail">Retail</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
          <select
            value={form.branch_id}
            onChange={(e) => setForm((f) => ({ ...f, branch_id: Number(e.target.value) }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value={1}>Chicago Main</option>
            <option value={2}>Chicago North</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea
            rows={3}
            placeholder="Project name, room, special instructions…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          {loading ? "Creating…" : "Create Order →"}
        </button>
      </form>
    </div>
  );
}
