"use client";

import { useState } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const TYPE_COLORS = {
  comment: { bg: "#EEF2FF", color: "#4F46E5", label: "Comment" },
  dm: { bg: "#ECFDF5", color: "#059669", label: "DM" },
  reel_share: { bg: "#F5F3FF", color: "#7C3AED", label: "Reel" },
  mention: { bg: "#FDF2F8", color: "#DB2777", label: "Mention" },
  reaction: { bg: "#FEF2F2", color: "#DC2626", label: "Reaction" },
  postback: { bg: "#F0F9FF", color: "#0284C7", label: "Postback" },
  smart_reply: { bg: "#F0FDFA", color: "#0D9488", label: "Smart Reply" },
  ai_detection: { bg: "#F5F3FF", color: "#6D28D9", label: "AI Detection" },
};

const STATUS_COLORS = {
  sent: { bg: "#ECFDF5", color: "#059669" },
  failed: { bg: "#FEF2F2", color: "#DC2626" },
  skipped: { bg: "#F4F4F5", color: "#A1A1AA" },
  quota_exceeded: { bg: "#FEF2F2", color: "#DC2626" },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function EventLog({ events = [], loading = false, emptyMessage = "No events" }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(events.length / pageSize);
  const paginated = events.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="rounded-xl p-12 flex items-center justify-center"
        style={{ background: "#FFFFFF", border: "1px solid #F0F0F0" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "#A1A1AA" }} />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #F0F0F0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: "#F4F4F5" }}>
        <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Activity log</h3>
      </div>

      {paginated.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm" style={{ color: "#A1A1AA" }}>{emptyMessage}</div>
      ) : (
        <div>
          {paginated.map((event, i) => {
            const typeStyle = TYPE_COLORS[event.type] || TYPE_COLORS.dm;
            const statusStyle = STATUS_COLORS[event.reply?.status] || STATUS_COLORS.skipped;
            return (
              <div key={event._id || i} className="px-5 py-3 flex items-center gap-4 text-sm transition-colors"
                style={{ borderTop: i > 0 ? "1px solid #F4F4F5" : "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250,250,250,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span className="text-xs w-14 flex-shrink-0" style={{ color: "#A1A1AA" }}>{timeAgo(event.createdAt)}</span>
                <span className="text-xs font-medium truncate w-20 flex-shrink-0" style={{ color: "#52525B" }}>
                  @{event.from?.username || "unknown"}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: typeStyle.bg, color: typeStyle.color }}>{typeStyle.label}</span>
                <span className="flex-1 truncate text-xs" style={{ color: "#71717A" }}>
                  {event.content?.text || event.reply?.privateDM || event.content?.attachmentType || "—"}
                </span>
                {event.reply?.status && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}>{event.reply.status}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F4F4F5" }}>
          <span className="text-xs" style={{ color: "#A1A1AA" }}>{events.length} events</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-1.5 rounded disabled:opacity-30" style={{ color: "#71717A" }}><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="p-1.5 rounded disabled:opacity-30" style={{ color: "#71717A" }}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
