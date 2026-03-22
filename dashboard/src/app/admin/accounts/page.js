"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Activity, AlertTriangle, Loader2 } from "lucide-react";
import StatCard from "../components/StatCard";
import PlanBadge from "../components/PlanBadge";
import DataTable from "../components/DataTable";
import { adminGetOverviewStats, adminGetAccounts } from "../admin-actions";

function timeAgo(date) {
  if (!date) return "—";
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function FlagDots({ flags }) {
  const dots = [
    { key: "aiProductDetectionUnlocked", label: "AI Detection", on: flags?.aiProductDetectionUnlocked },
    { key: "shopifyEnabled", label: "Shopify", on: flags?.shopifyEnabled },
    { key: "knowledgeBaseEnabled", label: "Knowledge Base", on: flags?.knowledgeBaseEnabled },
    { key: "smartRepliesEnabled", label: "Smart Replies", on: flags?.smartRepliesEnabled },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {dots.map((d) => (
        <span key={d.key} title={`${d.label}: ${d.on ? "On" : "Off"}`}
          className="w-2 h-2 rounded-full" style={{ background: d.on ? "#059669" : "#E2E8F0" }} />
      ))}
    </div>
  );
}

export default function AccountsPage() {
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

  const earlyAccessCount = (stats?.planBreakdown || []).find((p) => p._id === "trial")?.count || stats?.totalAccounts || 0;

  const columns = [
    {
      key: "username", label: "Account", sortable: true,
      render: (row) => (
        <Link href={`/admin/accounts/${row.userId}`} className="flex items-center gap-3 hover:opacity-80">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "#EEF2FF", color: "#4338CA" }}>
            {(row.instagramUsername || row.userId || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "#0F172A" }}>
              {row.instagramUsername ? `@${row.instagramUsername}` : row.userId}
            </p>
            {row.email && <p className="text-xs" style={{ color: "#94A3B8" }}>{row.email}</p>}
          </div>
        </Link>
      ),
    },
    {
      key: "igAccountCount", label: "IG Accounts", sortable: true, align: "center",
      render: (row) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#475569" }}>
          {row.igAccountCount || 0}
        </span>
      ),
    },
    {
      key: "plan", label: "Plan", sortable: true,
      render: (row) => <PlanBadge plan={row.subscription?.plan || "early_access"} />,
    },
    {
      key: "dmsSentThisMonth", label: "DMs/mo", sortable: true, align: "right",
      render: (row) => <span className="text-sm font-medium" style={{ color: "#0F172A" }}>{row.usage?.dmsSentThisMonth || 0}</span>,
    },
    {
      key: "createdAt", label: "Joined", sortable: true,
      render: (row) => <span className="text-xs" style={{ color: "#94A3B8" }}>{timeAgo(row.createdAt)}</span>,
    },
    {
      key: "flags", label: "Flags",
      render: (row) => <FlagDots flags={row.flags} />,
    },
    {
      key: "actions", label: "",
      render: (row) => (
        <Link href={`/admin/accounts/${row.userId}`}
          className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          style={{ color: "#4338CA" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2FF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>All accounts</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total accounts" value={stats?.totalAccounts ?? 0} icon={Users} />
        <StatCard label="Active (7d)" value={stats?.activeAccounts ?? 0} icon={Activity} />
        <StatCard label="Early Access" value={earlyAccessCount} />
        <StatCard label="With errors (24h)" value={stats?.errorAccountCount ?? 0} icon={AlertTriangle} />
      </div>

      <DataTable
        columns={columns}
        data={accounts}
        searchPlaceholder="Search by username or email..."
        searchKey="instagramUsername"
        pageSize={20}
        emptyMessage="No accounts found"
      />
    </div>
  );
}
