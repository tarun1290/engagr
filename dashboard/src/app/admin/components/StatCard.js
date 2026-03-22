"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, trend, trendDirection, icon: Icon, format = "number" }) {
  const formattedValue = format === "currency"
    ? `$${Number(value).toFixed(2)}`
    : format === "percentage"
      ? `${value}%`
      : typeof value === "number" ? value.toLocaleString() : value;

  const trendColor = trendDirection === "down" ? "#DC2626" : "#059669";
  const TrendIcon = trendDirection === "down" ? TrendingDown : TrendingUp;

  return (
    <div className="rounded-xl p-5 transition-shadow"
      style={{ background: "#FFFFFF", border: "1px solid #F0F0F0", boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)" }}>
      <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#A1A1AA" }}>{label}</p>
      <p className="text-3xl font-bold tracking-tight" style={{ color: "#18181B" }}>{formattedValue}</p>
      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1 mt-2">
          <TrendIcon size={12} style={{ color: trendColor }} />
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {trend > 0 ? "+" : ""}{trend} this month
          </span>
        </div>
      )}
    </div>
  );
}
