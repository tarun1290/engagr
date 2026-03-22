"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SIDEBAR_SECTIONS, STATUS_DOT_COLORS } from "./sidebarConfig";

function SidebarContent({ pathname }) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight" style={{ color: "#18181B" }}>
            Engagr<span style={{ color: "#4F46E5" }}>.</span>
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: "#EEF2FF", color: "#4F46E5" }}>Admin</span>
        </div>
      </div>

      <div className="h-px mx-4 mb-2" style={{ backgroundColor: "#F0F0F0" }} />

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-1 px-3">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold mt-4 mb-1.5 px-3"
              style={{ color: "#A1A1AA" }}>{section.label}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname?.startsWith(item.href));
              return (
                <Link key={item.id} href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 my-0.5"
                  style={{
                    background: isActive ? "#EEF2FF" : "transparent",
                    color: isActive ? "#4F46E5" : "#71717A",
                    fontWeight: isActive ? 500 : 400,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#F9FAFB"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? "#EEF2FF" : "transparent"; }}
                >
                  <Icon size={16} strokeWidth={1.5} style={{ color: isActive ? "#4F46E5" : "#A1A1AA" }} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.status && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: STATUS_DOT_COLORS[item.status] }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-40"
        style={{ background: "#FFFFFF", borderRight: "1px solid #F0F0F0" }}>
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile hamburger */}
      <button className="lg:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg"
        style={{ background: "#fff", border: "1px solid #F0F0F0" }}
        onClick={() => setMobileOpen(true)} aria-label="Menu">
        <Menu size={18} style={{ color: "#71717A" }} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full flex flex-col shadow-xl" style={{ background: "#FFFFFF" }}>
            <button className="absolute top-4 right-4 p-1" onClick={() => setMobileOpen(false)}>
              <X size={16} style={{ color: "#A1A1AA" }} />
            </button>
            <SidebarContent pathname={pathname} />
          </aside>
        </div>
      )}
    </>
  );
}
