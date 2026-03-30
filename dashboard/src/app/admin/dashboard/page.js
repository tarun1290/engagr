"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Activity, Zap, MessageSquare, ShieldCheck, Loader2, Sparkles, Briefcase, Building2 } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Line, Bar, BarChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import EventLog from "../components/EventLog";
import StatusBadge from "../components/StatusBadge";
import { adminGetOverviewStats, adminGetChartData, adminGetFeatureEvents, adminGetSystemFlags } from "../admin-actions";

const FEATURE_LIST = [
  { name: "Comment-to-DM", slug: "comment-to-dm", status: "live" },
  { name: "Follower gate", slug: "follower-gate", status: "live" },
  { name: "Reel share replies", slug: "reel-share", status: "live" },
  { name: "Mention detection", slug: "mentions", status: "live" },
  { name: "Smart reel rules", slug: "reel-rules", status: "live" },
  { name: "AI product detection", slug: "ai-detection", status: "disabled" },
  { name: "Smart link tracking", slug: "smart-links", status: "disabled" },
  { name: "Shopify integration", slug: "shopify", status: "disabled" },
  { name: "AI smart replies", slug: "smart-replies", status: "disabled" },
  { name: "Knowledge base", slug: "knowledge-base", status: "disabled" },
  { name: "Conversations", slug: "conversations", status: "disabled" },
  { name: "Analytics", slug: "analytics", status: "planned" },
  { name: "API access", slug: "api-access", status: "planned" },
  { name: "Payments", slug: "payments", status: "disabled" },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-md" style={{ background: "#fff", border: "1px solid #E4E4E7" }}>
      <p className="font-medium mb-1" style={{ color: "#18181B" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [dmsData, setDmsData] = useState([]);
  const [events, setEvents] = useState([]);
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminGetOverviewStats(),
      adminGetChartData("account_growth", 30),
      adminGetChartData("dms_sent", 30),
      adminGetFeatureEvents("all", 1, 20),
      adminGetSystemFlags(),
    ]).then(([s, g, d, e, f]) => {
      setStats(s);
      setGrowthData(g.data || []);
      setDmsData(d.data || []);
      setEvents(e.events || []);
      setFlags(f);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#A1A1AA" }} /></div>;
  }

  const healthColor = (stats?.webhookHealth ?? 100) >= 99 ? "#059669" : stats?.webhookHealth >= 95 ? "#D97706" : "#DC2626";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "#18181B" }}>Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total accounts" value={stats?.totalAccounts ?? 0} icon={Users} trend={stats?.newThisMonth} />
        <StatCard label="Active (7d)" value={stats?.activeAccounts ?? 0} icon={Activity} />
        <StatCard label="Total DMs sent" value={stats?.totalDmsSent ?? 0} icon={MessageSquare} trend={stats?.dmsThisMonth} />
        <StatCard label="Active automations" value={stats?.activeAutomations ?? 0} icon={Zap} />
        <StatCard label="Webhook health" value={stats?.webhookHealth ?? 100} icon={ShieldCheck} format="percentage" />
      </div>

      {/* Account type breakdown */}
      {stats?.accountTypeBreakdown && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Creators", value: stats.accountTypeBreakdown.creator, color: "#7C3AED", icon: Sparkles },
            { label: "Businesses", value: stats.accountTypeBreakdown.business, color: "#2563EB", icon: Briefcase },
            { label: "Agencies", value: stats.accountTypeBreakdown.agency, color: "#0D9488", icon: Building2 },
            { label: "Unset", value: stats.accountTypeBreakdown.unset, color: "#A1A1AA", icon: Users, tooltip: "Users who signed up before account types were introduced" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "#fff", border: "1px solid #E4E4E7", borderLeft: `3px solid ${item.color}` }}
                title={item.tooltip || ""}>
                <Icon size={15} style={{ color: item.color }} />
                <div>
                  <p className="text-lg font-bold" style={{ color: "#18181B" }}>{item.value}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>{item.label}</p>
                </div>
              </div>
            );
          })}

          {/* Mini donut chart */}
          {(stats.accountTypeBreakdown.creator + stats.accountTypeBreakdown.business + stats.accountTypeBreakdown.agency + stats.accountTypeBreakdown.unset) >= 5 ? (
            <div className="flex items-center justify-center px-4 py-3 rounded-xl" style={{ background: "#fff", border: "1px solid #E4E4E7" }}>
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Creator", value: stats.accountTypeBreakdown.creator },
                      { name: "Business", value: stats.accountTypeBreakdown.business },
                      { name: "Agency", value: stats.accountTypeBreakdown.agency },
                      { name: "Unset", value: stats.accountTypeBreakdown.unset },
                    ].filter((d) => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" stroke="none"
                  >
                    {["#7C3AED", "#2563EB", "#0D9488", "#A1A1AA"].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} users`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center px-4 py-3 rounded-xl" style={{ background: "#fff", border: "1px solid #E4E4E7" }}>
              <p className="text-[10px] text-center" style={{ color: "#A1A1AA" }}>Not enough data yet</p>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Account growth (30 days)" isEmpty={growthData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#A1A1AA" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "#A1A1AA" }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="signups" fill="#C7D2FE" name="New signups" radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={2} dot={false} name="Total" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="DMs sent per day (30 days)" isEmpty={dmsData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dmsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#A1A1AA" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "#A1A1AA" }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="dms" fill="#059669" name="DMs sent" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent activity */}
      <EventLog events={events} emptyMessage="No recent events" />

      {/* Feature health summary */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #E4E4E7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "#F4F4F5" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#18181B" }}>Feature health</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Feature</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Status</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Enabled users</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Events today</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_LIST.map((f) => (
                <tr key={f.slug} className="transition-colors cursor-pointer" style={{ borderTop: "1px solid #F4F4F5" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFAFA"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/features/${f.slug}`} className="font-medium hover:underline" style={{ color: "#18181B" }}>{f.name}</Link>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-5 py-3 text-right" style={{ color: "#475569" }}>
                    {f.status === "live" ? stats?.totalAccounts || 0 : flags?.flagCounts ? (
                      f.slug === "ai-detection" || f.slug === "smart-links" ? flags.flagCounts.aiProductDetectionUnlocked || 0 :
                      f.slug === "shopify" ? flags.flagCounts.shopifyEnabled || 0 :
                      f.slug === "smart-replies" || f.slug === "conversations" ? flags.flagCounts.smartRepliesEnabled || 0 :
                      f.slug === "knowledge-base" ? flags.flagCounts.knowledgeBaseEnabled || 0 : 0
                    ) : 0}
                  </td>
                  <td className="px-5 py-3 text-right" style={{ color: "#475569" }}>{f.status === "live" ? stats?.eventsToday || 0 : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
