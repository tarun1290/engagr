"use client";

import { useEffect, useState } from "react";
import { DollarSign, Users, Clock, TrendingDown, Loader2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import PlanBadge from "../components/PlanBadge";
import DataTable from "../components/DataTable";
import { adminGetOverviewStats, adminGetAccounts } from "../admin-actions";

const PIE_COLORS = {
  trial: "#0D9488",
  early_access: "#0D9488",
  silver: "#64748B",
  gold: "#D97706",
  platinum: "#4338CA",
};

function ChartTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-md" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
      <p className="font-medium" style={{ color: "#0F172A" }}>{payload[0].name}: {payload[0].value}</p>
    </div>
  );
}

export default function BillingPage() {
  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminGetOverviewStats(),
      adminGetAccounts({}, { field: "createdAt", dir: "desc" }, 1, 200),
    ]).then(([s, a]) => {
      setStats(s);
      setAccounts(a.accounts || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#94A3B8" }} /></div>;
  }

  const planBreakdown = stats?.planBreakdown || [];
  const pieData = planBreakdown.map((p) => ({
    name: p._id === "trial" ? "Early Access" : (p._id || "Early Access"),
    value: p.count,
    fill: PIE_COLORS[p._id] || PIE_COLORS.trial,
  }));
  if (pieData.length === 0) pieData.push({ name: "Early Access", value: stats?.totalAccounts || 0, fill: PIE_COLORS.trial });

  const planSummary = planBreakdown.map((p) => `${p.count} ${p._id === "trial" ? "Early Access" : p._id || "Early Access"}`).join(", ") || `${stats?.totalAccounts || 0} Early Access`;

  const columns = [
    {
      key: "username", label: "Account", sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: "#0F172A" }}>
            {row.instagramUsername ? `@${row.instagramUsername}` : row.userId}
          </p>
          {row.email && <p className="text-xs" style={{ color: "#94A3B8" }}>{row.email}</p>}
        </div>
      ),
    },
    {
      key: "plan", label: "Plan", sortable: true,
      render: (row) => <PlanBadge plan={row.subscription?.plan || "early_access"} />,
    },
    {
      key: "dms", label: "DMs used", align: "right",
      render: (row) => (
        <span className="text-sm" style={{ color: "#475569" }}>
          {(row.usage?.dmsSentThisMonth || 0).toLocaleString()} / <span style={{ color: "#94A3B8" }}>unlimited</span>
        </span>
      ),
    },
    {
      key: "planStart", label: "Since",
      render: (row) => <span className="text-xs" style={{ color: "#94A3B8" }}>{row.subscription?.currentPeriodStart ? new Date(row.subscription.currentPeriodStart).toLocaleDateString() : new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "nextBilling", label: "Next billing",
      render: () => <span className="text-xs" style={{ color: "#94A3B8" }}>—</span>,
    },
    {
      key: "status", label: "Status",
      render: (row) => {
        const s = row.subscription?.status || "trialing";
        const style = s === "active" || s === "trialing"
          ? { bg: "#ECFDF5", color: "#059669" }
          : s === "past_due" ? { bg: "#FFFBEB", color: "#D97706" }
          : { bg: "#FEF2F2", color: "#DC2626" };
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: style.bg, color: style.color }}>
            {s === "trialing" ? "Active" : s}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Plans & billing</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="MRR" value="₹0" icon={DollarSign} />
        <StatCard label="Accounts by plan" value={stats?.totalAccounts ?? 0} icon={Users} />
        <StatCard label="Trial users" value={0} icon={Clock} />
        <StatCard label="Churn this month" value={0} icon={TrendingDown} />
      </div>

      {/* Plan summary */}
      <p className="text-sm" style={{ color: "#64748B" }}>Plan breakdown: {planSummary}</p>
      <p className="text-xs px-3 py-2 rounded-lg inline-block" style={{ background: "#F0FDFA", color: "#0D9488", border: "1px solid #99F6E4" }}>
        All accounts are on Early Access — no billing active
      </p>

      {/* Plan distribution chart */}
      <ChartCard title="Plan distribution" isEmpty={pieData.length === 0 && !stats?.totalAccounts}>
        <div className="flex items-center justify-center h-full">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="ml-6 space-y-2">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: p.fill }} />
                <span className="text-xs" style={{ color: "#475569" }}>{p.name}: {p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Account plan table */}
      <DataTable
        columns={columns}
        data={accounts}
        searchPlaceholder="Search accounts..."
        searchKey="instagramUsername"
        pageSize={20}
        emptyMessage="No accounts found"
      />
    </div>
  );
}
