const map: Record<string, { bg: string; text: string; label?: string }> = {
  draft:     { bg: "bg-slate-100",  text: "text-slate-600"  },
  open:      { bg: "bg-blue-50",    text: "text-blue-700"   },
  receiving: { bg: "bg-amber-50",   text: "text-amber-700"  },
  received:  { bg: "bg-green-50",   text: "text-green-700"  },
  closed:    { bg: "bg-slate-100",  text: "text-slate-500"  },
  pending:   { bg: "bg-slate-100",  text: "text-slate-600"  },
  reserved:  { bg: "bg-indigo-50",  text: "text-indigo-700" },
  confirmed: { bg: "bg-blue-50",    text: "text-blue-700"   },
  picking:   { bg: "bg-amber-50",   text: "text-amber-700"  },
  picked:    { bg: "bg-green-50",   text: "text-green-700"  },
  shipped:   { bg: "bg-emerald-50", text: "text-emerald-700"},
  cancelled: { bg: "bg-red-50",     text: "text-red-600"    },
  short:     { bg: "bg-red-50",     text: "text-red-600"    },
  over:      { bg: "bg-orange-50",  text: "text-orange-700" },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = map[status] ?? { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}
