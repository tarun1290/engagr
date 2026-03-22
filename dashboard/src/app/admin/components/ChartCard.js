"use client";

import { BarChart3 } from "lucide-react";

export default function ChartCard({ title, children, isEmpty = false, emptyMessage = "No data yet", emptySubtext = "Data will appear here once events are recorded." }) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #F0F0F0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "#F4F4F5" }}>
        <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>{title}</h3>
      </div>
      <div style={{ height: 280 }}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed"
              style={{ borderColor: "#E4E4E7" }}>
              <BarChart3 size={24} style={{ color: "#D4D4D8" }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "#52525B" }}>{emptyMessage}</p>
            <p className="text-xs" style={{ color: "#A1A1AA" }}>{emptySubtext}</p>
          </div>
        ) : (
          <div className="p-4 h-full">{children}</div>
        )}
      </div>
    </div>
  );
}
