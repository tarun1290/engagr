"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Activity, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import StatCard from "../components/StatCard";
import PlanBadge from "../components/PlanBadge";
import DataTable from "../components/DataTable";
import ConfirmModal from "../components/ConfirmModal";
import { adminGetOverviewStats, adminGetAccounts } from "../admin-actions";
import { deleteUser } from "../actions";

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
          className="w-2 h-2 rounded-full" style={{ background: d.on ? "#059669" : "#E4E4E7" }} />
      ))}
    </div>
  );
}

export default function AccountsPage() {
  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#A1A1AA" }} /></div>;
  }

  const earlyAccessCount = (stats?.planBreakdown || []).find((p) => p._id === "trial")?.count || stats?.totalAccounts || 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteUser(deleteTarget.userId, deleteConfirmText);
    if (res.success) {
      toast.success(`Account deleted. ${res.deleted.events} events, ${res.deleted.igAccounts} accounts removed.`);
      setAccounts((prev) => prev.filter((a) => a.userId !== deleteTarget.userId));
    } else {
      toast.error(res.error || "Failed to delete");
    }
    setDeleting(false);
    setDeleteTarget(null);
    setDeleteConfirmText("");
  };

  const ACCOUNT_TYPE_COLORS = {
    creator: { bg: "#FDF2F8", color: "#EC4899", label: "Creator" },
    business: { bg: "#EEF2FF", color: "#4F46E5", label: "Business" },
    agency: { bg: "#F0F9FF", color: "#0EA5E9", label: "Agency" },
  };

  const columns = [
    {
      key: "username", label: "Account", sortable: true,
      render: (row) => (
        <Link href={`/admin/accounts/${row.userId}`} className="flex items-center gap-3 hover:opacity-80">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "#EEF2FF", color: "#4F46E5" }}>
            {(row.instagramUsername || row.userId || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "#18181B" }}>
              {row.instagramUsername ? `@${row.instagramUsername}` : row.userId}
            </p>
            {row.email && <p className="text-xs" style={{ color: "#A1A1AA" }}>{row.email}</p>}
          </div>
        </Link>
      ),
    },
    {
      key: "accountType", label: "Type", sortable: true,
      render: (row) => {
        const t = ACCOUNT_TYPE_COLORS[row.accountType];
        if (!t) return <span className="text-xs" style={{ color: "#A1A1AA" }}>—</span>;
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.color }}>
            {t.label}
          </span>
        );
      },
    },
    {
      key: "igAccountCount", label: "IG Accounts", sortable: true, align: "center",
      render: (row) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F4F4F5", color: "#475569" }}>
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
      render: (row) => <span className="text-sm font-medium" style={{ color: "#18181B" }}>{row.usage?.dmsSentThisMonth || 0}</span>,
    },
    {
      key: "createdAt", label: "Joined", sortable: true,
      render: (row) => <span className="text-xs" style={{ color: "#A1A1AA" }}>{timeAgo(row.createdAt)}</span>,
    },
    {
      key: "flags", label: "Flags",
      render: (row) => <FlagDots flags={row.flags} />,
    },
    {
      key: "actions", label: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/accounts/${row.userId}`}
            className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{ color: "#4F46E5" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2FF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            View
          </Link>
          <button onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "#A1A1AA" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#A1A1AA"; e.currentTarget.style.background = "transparent"; }}
            title="Delete account">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "#18181B" }}>All accounts</h1>

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

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}
        onConfirm={handleDelete}
        title={`Delete @${deleteTarget?.instagramUsername || deleteTarget?.userId}?`}
        description="This will permanently delete the account and ALL associated data: events, contacts, automations, connected Instagram accounts. This cannot be undone."
        confirmLabel="Delete account"
        confirmColor="danger"
        loading={deleting}
      >
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "#A1A1AA" }}>
            Type <strong style={{ color: "#18181B" }}>{deleteTarget?.instagramUsername || deleteTarget?.email || deleteTarget?.userId}</strong> to confirm:
          </p>
          <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type to confirm..."
            className="w-full px-3 py-2 text-sm rounded-lg outline-none"
            style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
          {deleteConfirmText && deleteConfirmText !== (deleteTarget?.instagramUsername || deleteTarget?.email || deleteTarget?.userId) && (
            <p className="text-xs" style={{ color: "#DC2626" }}>Does not match</p>
          )}
        </div>
      </ConfirmModal>
    </div>
  );
}
