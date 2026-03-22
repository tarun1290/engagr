"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Info } from "lucide-react";
import ToggleSwitch from "./ToggleSwitch";
import PlanBadge from "./PlanBadge";
import ConfirmModal from "./ConfirmModal";

/**
 * Account management table with per-feature toggles.
 *
 * @param {{
 *   featureName: string,
 *   featureFlag: string,
 *   codeStatus: 'live' | 'disabled' | 'planned',
 *   accountStatColumn?: { key: string, label: string },
 *   accounts: any[],
 *   onToggle: (userId: string, enabled: boolean) => Promise<any>,
 *   onBulkToggle?: (userIds: string[], enabled: boolean) => Promise<any>,
 * }} props
 */
export default function AccountFeatureTable({ featureName, featureFlag, codeStatus, accountStatColumn, accounts = [], onToggle, onBulkToggle }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [confirmUser, setConfirmUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'enable' | 'disable'
  const [loading, setLoading] = useState(null); // userId being toggled
  const [notes, setNotes] = useState("");

  const pageSize = 20;
  const isCodeDisabled = codeStatus === "disabled" || codeStatus === "planned";

  const filtered = accounts.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.instagramUsername || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q) || (a.userId || "").includes(q);
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleToggle = async () => {
    if (!confirmUser) return;
    setLoading(confirmUser.userId);
    try {
      await onToggle(confirmUser.userId, confirmAction === "enable");
    } catch { /* handled by parent */ }
    setLoading(null);
    setConfirmUser(null);
    setConfirmAction(null);
    setNotes("");
  };

  const handleBulk = async (enabled) => {
    if (!onBulkToggle || selected.size === 0) return;
    setLoading("bulk");
    await onBulkToggle(Array.from(selected), enabled);
    setLoading(null);
    setSelected(new Set());
  };

  const allSelected = paginated.length > 0 && paginated.every((a) => selected.has(a.userId));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(paginated.map((a) => a.userId)));
  };

  return (
    <div className="space-y-4">
      {/* Status banners */}
      {codeStatus === "disabled" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
          <AlertTriangle size={16} />
          This feature is currently disabled at the code level. Toggle switches will become active after uncommenting the code.
        </div>
      )}
      {codeStatus === "planned" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
          style={{ background: "#F8FAFC", border: "1px solid #E4E4E7", color: "#71717A" }}>
          <Info size={16} />
          This feature is not yet built. See roadmap.
        </div>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && !isCodeDisabled && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
          <span className="text-sm font-medium" style={{ color: "#4F46E5" }}>{selected.size} selected</span>
          <button onClick={() => handleBulk(true)} className="text-xs font-medium px-3 py-1.5 rounded-md text-white" style={{ background: "#059669" }}>Enable for selected</button>
          <button onClick={() => handleBulk(false)} className="text-xs font-medium px-3 py-1.5 rounded-md" style={{ background: "#FEF2F2", color: "#DC2626" }}>Disable for selected</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-4" style={{ borderColor: "#F4F4F5" }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#A1A1AA" }} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search accounts..." className="w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none"
              style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th className="px-5 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded" style={{ accentColor: "#4F46E5" }} />
                </th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Account</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>Plan</th>
                {accountStatColumn && (
                  <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>{accountStatColumn.label}</th>
                )}
                <th className="text-center px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A1A1AA" }}>{featureName}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: "#A1A1AA" }}>No accounts found</td></tr>
              ) : (
                paginated.map((account) => {
                  const isEnabled = !!account.flags?.[featureFlag];
                  return (
                    <tr key={account.userId} style={{ borderTop: "1px solid #F4F4F5" }}>
                      <td className="px-5 py-3">
                        <input type="checkbox" checked={selected.has(account.userId)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            e.target.checked ? next.add(account.userId) : next.delete(account.userId);
                            setSelected(next);
                          }}
                          className="rounded" style={{ accentColor: "#4F46E5" }} />
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-sm" style={{ color: "#18181B" }}>
                          {account.instagramUsername ? `@${account.instagramUsername}` : account.userId}
                        </p>
                        {account.email && <p className="text-xs" style={{ color: "#A1A1AA" }}>{account.email}</p>}
                      </td>
                      <td className="px-5 py-3"><PlanBadge plan={account.subscription?.plan || "early_access"} /></td>
                      {accountStatColumn && (
                        <td className="px-5 py-3 text-right font-medium" style={{ color: "#18181B" }}>
                          {account[accountStatColumn.key] ?? 0}
                        </td>
                      )}
                      <td className="px-5 py-3 text-center">
                        <ToggleSwitch
                          enabled={isEnabled}
                          disabled={isCodeDisabled}
                          loading={loading === account.userId}
                          onChange={(enabled) => {
                            setConfirmUser(account);
                            setConfirmAction(enabled ? "enable" : "disable");
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F4F4F5" }}>
            <span className="text-xs" style={{ color: "#A1A1AA" }}>{filtered.length} accounts — Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-1.5 rounded disabled:opacity-30" style={{ color: "#71717A" }}><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="p-1.5 rounded disabled:opacity-30" style={{ color: "#71717A" }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={!!confirmUser}
        onClose={() => { setConfirmUser(null); setNotes(""); }}
        onConfirm={handleToggle}
        title={`${confirmAction === "enable" ? "Enable" : "Disable"} ${featureName}`}
        description={`${confirmAction === "enable" ? "Enable" : "Disable"} ${featureName} for ${confirmUser?.instagramUsername ? "@" + confirmUser.instagramUsername : confirmUser?.userId}?`}
        confirmLabel={confirmAction === "enable" ? "Enable" : "Disable"}
        confirmColor={confirmAction === "enable" ? "success" : "danger"}
        loading={!!loading}
      >
        {confirmAction === "enable" && (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#71717A" }}>Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why are you enabling this?"
              className="w-full px-3 py-2 text-sm rounded-md outline-none" style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
