"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  {
    label: "Operations",
    items: [
      { href: "/",                 icon: "⬛", label: "Dashboard"       },
      { href: "/purchase-orders",  icon: "📥", label: "Receiving"       },
      { href: "/sales-orders",     icon: "📦", label: "Sales & Picking" },
      { href: "/inventory",        icon: "🗃", label: "Inventory"       },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-0.5">Nexus ERP</div>
        <div className="text-sm font-medium text-white">Hydrology Chicago</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {nav.map((section) => (
          <div key={section.label}>
            <div className="px-2 mb-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                    active
                      ? "bg-blue-600 text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">Logged in as</div>
        <div className="text-sm text-slate-300 font-medium">Sarah Chen</div>
        <div className="text-xs text-slate-500">Manager · Main Branch</div>
      </div>
    </aside>
  );
}
