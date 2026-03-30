"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Users, Activity, AlertTriangle, Loader2, Trash2, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import StatCard from "../components/StatCard";
import PlanBadge from "../components/PlanBadge";
import DataTable from "../components/DataTable";
import ConfirmModal from "../components/ConfirmModal";
import { adminGetOverviewStats, adminGetAccounts, adminUpdateAccountType } from "../admin-actions";
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

function TypeDropdown({ userId, currentType, name, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const TYPES = [
    { value: "creator", label: "Creator", bg: "#F3E8FF", color: "#7C3AED" },
    { value: "business", label: "Business", bg: "#EEF2FF", color: "#4F46E5" },
    { value: "agency", label: "Agency", bg: "#ECFEFF", color: "#0891B2" },
  ];

  const current = TYPES.find((t) => t.value === currentType);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors"
        style={{ background: current?.bg || "#F4F4F5", color: current?.color || "#A1A1AA" }}>
        {current?.label || "Unset"} <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{ background: "#fff", border: "1px solid #E4E4E7" }}>
          {TYPES.map((t) => (
            <button key={t.value} onClick={async () => {
              setOpen(false);
              onUpdate(userId, t.value);
              const res = await adminUpdateAccountType(userId, t.value);
              if (res.success) toast.success(`Account type updated for ${name}`);
              else toast.error(res.error || "Failed to update");
            }}
              className="w-full text-left px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ color: t.value === currentType ? t.color : "#71717A" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      )}
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
  const [filterType, setFilterType] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterConnected, setFilterConnected] = useState("all");
  const searchTimerRef = useRef(null);

  const fetchAccounts = (filters = {}) => {
    adminGetAccounts(filters, { field: "createdAt", dir: "desc" }, 1, 200)
      .then((a) => setAccounts(a.accounts || []))
      .catch(console.error);
  };

  useEffect(() => {
    Promise.all([
      adminGetOverviewStats(),
      adminGetAccounts({}, { field: "createdAt", dir: "desc" }, 1, 200),
    ]).then(([s, a]) => {
      setStats(s);
      setAccounts(a.accounts || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Debounced search + filter
  useEffect(() => {
    if (loading) return;
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const filters = {};
      if (filterType !== "all") filters.accountType = filterType;
      if (filterSearch) filters.search = filterSearch;
      fetchAccounts(filters);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [filterType, filterSearch]);

  const handleTypeUpdate = (userId, newType) => {
    setAccounts((prev) => prev.map((a) => a.userId === userId ? { ...a, accountType: newType } : a));
  };

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
      render: (row) => (
        <TypeDropdown
          userId={row.userId}
          currentType={row.accountType}
          name={row.instagramUsername || row.name || row.email || row.userId}
          onUpdate={handleTypeUpdate}
        />
      ),
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

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg" style={{ background: "#fff", border: "1px solid #E4E4E7" }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#A1A1AA" }} />
          <input
            type="text"
            placeholder="Search name, email, or handle..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none"
            style={{ border: "1px solid #E4E4E7", color: "#18181B" }}
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="text-sm px-3 py-2 rounded-md outline-none"
          style={{ border: "1px solid #E4E4E7", color: "#18181B", background: "#fff" }}>
          <option value="all">All Types</option>
          <option value="creator">Creator</option>
          <option value="business">Business</option>
          <option value="agency">Agency</option>
        </select>
        <select value={filterConnected} onChange={(e) => setFilterConnected(e.target.value)}
          className="text-sm px-3 py-2 rounded-md outline-none"
          style={{ border: "1px solid #E4E4E7", color: "#18181B", background: "#fff" }}>
          <option value="all">All</option>
          <option value="connected">Connected only</option>
          <option value="disconnected">Not connected</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filterConnected === "all" ? accounts : filterConnected === "connected" ? accounts.filter((a) => a.isConnected) : accounts.filter((a) => !a.isConnected)}
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
