"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Loader2 } from "lucide-react";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { adminGetSystemFlags } from "../../admin-actions";

const FEATURES = [
  { name: "Comment-to-DM", slug: "comment-to-dm", tag: "", status: "live", flag: null },
  { name: "Follower gate", slug: "follower-gate", tag: "", status: "live", flag: null },
  { name: "Reel share replies", slug: "reel-share", tag: "", status: "live", flag: null },
  { name: "Mention detection", slug: "mentions", tag: "", status: "live", flag: null },
  { name: "Smart reel rules", slug: "reel-rules", tag: "", status: "live", flag: null },
  { name: "AI product detection", slug: "ai-detection", tag: "[AI DETECTION]", status: "disabled", flag: "aiProductDetectionUnlocked" },
  { name: "Smart link tracking", slug: "smart-links", tag: "[AI DETECTION]", status: "disabled", flag: "aiProductDetectionUnlocked" },
  { name: "Shopify integration", slug: "shopify", tag: "[SMART FEATURES]", status: "disabled", flag: "shopifyEnabled" },
  { name: "AI smart replies", slug: "smart-replies", tag: "[SMART FEATURES]", status: "disabled", flag: "smartRepliesEnabled" },
  { name: "Knowledge base", slug: "knowledge-base", tag: "[SMART FEATURES]", status: "disabled", flag: "knowledgeBaseEnabled" },
  { name: "Conversations", slug: "conversations", tag: "[SMART FEATURES]", status: "disabled", flag: "smartRepliesEnabled" },
  { name: "Advanced analytics", slug: "analytics", tag: "", status: "planned", flag: null },
  { name: "API access", slug: "api-access", tag: "", status: "planned", flag: null },
  { name: "Payments", slug: "payments", tag: "[PAYMENTS DISABLED]", status: "disabled", flag: null },
  { name: "Feature gating", slug: null, tag: "[PLANS DISABLED]", status: "disabled", flag: null },
  { name: "Early access mode", slug: null, tag: "", status: "live", flag: null },
];

export default function FeatureFlagsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetSystemFlags().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#A1A1AA" }} /></div>;

  const liveCount = FEATURES.filter(f => f.status === "live").length;
  const disabledCount = FEATURES.filter(f => f.status === "disabled").length;
  const plannedCount = FEATURES.filter(f => f.status === "planned").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#18181B" }}>Feature flags</h1>
        <p className="text-sm" style={{ color: "#71717A" }}>Global overview of all features, their code status, and account enablement</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Live features" value={liveCount} icon={Flag} />
        <StatCard label="Disabled features" value={disabledCount} />
        <StatCard label="Planned features" value={plannedCount} />
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #E4E4E7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Feature</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Code tag</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Status</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Enabled</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Total events</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Today</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Errors (24h)</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => {
                const enabled = f.flag ? (data?.flagCounts?.[f.flag] || 0) : (f.status === "live" ? data?.totalUsers || 0 : 0);
                const slug = f.slug;
                const totalEvents = slug && data?.featureTotalEvents?.[slug] || 0;
                const todayEvents = slug && data?.featureEventCounts?.[slug] || 0;
                const errorRate = slug && data?.featureErrorRates?.[slug] || 0;
                const errorColor = errorRate > 5 ? "#DC2626" : errorRate > 1 ? "#D97706" : "#059669";

                return (
                  <tr key={f.name} className="transition-colors" style={{ borderTop: "1px solid #F4F4F5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFAFA"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td className="px-5 py-3">
                      {f.slug ? (
                        <Link href={`/admin/features/${f.slug}`} className="font-medium hover:underline" style={{ color: "#18181B" }}>{f.name}</Link>
                      ) : (
                        <span className="font-medium" style={{ color: "#18181B" }}>{f.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {f.tag ? <code className="text-xs font-mono" style={{ color: "#71717A" }}>{f.tag}</code> : <span style={{ color: "#D4D4D8" }}>—</span>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={f.status} /></td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: "#18181B" }}>{enabled}</td>
                    <td className="px-5 py-3 text-right" style={{ color: "#475569" }}>{totalEvents}</td>
                    <td className="px-5 py-3 text-right" style={{ color: "#475569" }}>{todayEvents}</td>
                    <td className="px-5 py-3 text-right" style={{ color: errorColor }}>{errorRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
