"use client";

import { useEffect, useState } from "react";
import { Radio, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import StatCard from "../../components/StatCard";
import ChartCard from "../../components/ChartCard";
import { adminGetWebhookLogs } from "../../admin-actions";

const TYPE_COLORS = {
  messaging: { bg: "#EFF6FF", color: "#2563EB" },
  comment: { bg: "#ECFDF5", color: "#059669" },
  mention: { bg: "#FDF2F8", color: "#DB2777" },
  feed: { bg: "#F5F3FF", color: "#7C3AED" },
};

function timeAgo(date) {
  if (!date) return "—";
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function WebhookLogsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetWebhookLogs({}, page, 20).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#94A3B8" }} /></div>;

  const stats = data?.stats || {};
  const logs = data?.logs || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Webhook logs</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>Monitor incoming webhooks and processing status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Received (24h)" value={stats.received24h || 0} icon={Radio} />
        <StatCard label="Success rate" value={stats.successRate || 100} format="percentage" />
        <StatCard label="Avg processing" value={`${stats.avgProcessingMs || 0}ms`} />
        <StatCard label="Errors (24h)" value={stats.errors24h || 0} />
      </div>

      <ChartCard title="Webhook activity (24h)" isEmpty={logs.length === 0}
        emptyMessage="No webhook events" emptySubtext="Events will appear as they're received">
        <div className="flex items-center justify-center h-full text-sm" style={{ color: "#94A3B8" }}>
          Chart renders with Recharts when WebhookLog data is available
        </div>
      </ChartCard>

      <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#0F172A" }}>Event log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Time</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Account</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Type</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Status</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center" style={{ color: "#94A3B8" }}>No webhook events</td></tr>
              ) : logs.map((log, i) => {
                const type = log.type || log.eventType || "messaging";
                const tc = TYPE_COLORS[type] || TYPE_COLORS.messaging;
                const status = log.reply?.status || log.status || "success";
                const statusColor = status === "sent" || status === "success" ? "#059669" : status === "failed" ? "#DC2626" : "#94A3B8";
                return (
                  <tr key={log._id || i} style={{ borderTop: "1px solid #F1F5F9" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFAFA"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{timeAgo(log.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium" style={{ color: "#475569" }}>
                      @{log.from?.username || "unknown"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.color }}>{type}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-medium" style={{ color: statusColor }}>{status}</span>
                    </td>
                    <td className="px-5 py-3 text-xs truncate max-w-[200px]" style={{ color: "#64748B" }}>
                      {log.content?.text || log.errorMessage || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F1F5F9" }}>
            <span className="text-xs" style={{ color: "#94A3B8" }}>Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded disabled:opacity-30" style={{ color: "#64748B" }}><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded disabled:opacity-30" style={{ color: "#64748B" }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
