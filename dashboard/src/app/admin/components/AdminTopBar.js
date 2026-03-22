"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { SIDEBAR_SECTIONS } from "./sidebarConfig";

function getPageTitle(pathname) {
  for (const section of SIDEBAR_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || (item.href !== "/admin/dashboard" && pathname?.startsWith(item.href))) {
        return item.label;
      }
    }
  }
  return "Dashboard";
}

export default function AdminTopBar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6"
      style={{ background: "#FAFAFA" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span style={{ color: "#A1A1AA" }}>Admin</span>
        <ChevronRight size={14} style={{ color: "#D4D4D8" }} />
        <span className="font-medium" style={{ color: "#18181B" }}>{pageTitle}</span>
      </div>

      {/* Admin info */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium hidden sm:inline" style={{ color: "#71717A" }}>admin</span>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: "#EEF2FF", color: "#4F46E5" }}>
          A
        </div>
      </div>
    </header>
  );
}
