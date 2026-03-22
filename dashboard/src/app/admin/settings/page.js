"use client";

import { useEffect, useState } from "react";
import { Settings, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import { adminGetEnvStatus, adminResetAllFlags } from "../admin-actions";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [envVars, setEnvVars] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    adminGetEnvStatus().then(setEnvVars).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleReset = async () => {
    setResetting(true);
    const res = await adminResetAllFlags();
    if (res.success) toast.success("All feature flags reset");
    else toast.error("Failed to reset");
    setResetting(false);
    setShowReset(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#94A3B8" }} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Settings</h1>

      {/* Admin account */}
      <div className="rounded-lg p-6" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F172A" }}>Admin account</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: "#64748B" }}>Role</span>
            <span className="font-medium" style={{ color: "#0F172A" }}>Platform Administrator</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#64748B" }}>Auth method</span>
            <span style={{ color: "#0F172A" }}>Admin key</span>
          </div>
        </div>
      </div>

      {/* Platform settings */}
      <div className="rounded-lg p-6" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F172A" }}>Platform settings</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#64748B" }}>App name</label>
            <input type="text" defaultValue="Engagr" readOnly className="w-full px-3 py-2 text-sm rounded-md" style={{ border: "1px solid #E2E8F0", color: "#0F172A", background: "#FAFAFA" }} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#64748B" }}>Support email</label>
            <input type="email" defaultValue="tarun@engagr.io" readOnly className="w-full px-3 py-2 text-sm rounded-md" style={{ border: "1px solid #E2E8F0", color: "#0F172A", background: "#FAFAFA" }} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium" style={{ color: "#0F172A" }}>Early access mode</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>All features free — no billing active</p>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>Active</span>
          </div>
        </div>
      </div>

      {/* Environment variables */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#0F172A" }}>Environment variables</h2>
          <p className="text-xs" style={{ color: "#94A3B8" }}>Check which variables are configured (values are not shown)</p>
        </div>
        {envVars && Object.entries(envVars).map(([group, vars]) => (
          <div key={group}>
            <div className="px-6 py-2" style={{ background: "#FAFAFA" }}>
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>{group}</span>
            </div>
            {vars.map((v) => (
              <div key={v.name} className="flex items-center justify-between px-6 py-2.5" style={{ borderTop: "1px solid #F8FAFC" }}>
                <code className="text-xs font-mono" style={{ color: "#475569" }}>{v.name}</code>
                {v.set ? (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#059669" }}>
                    <CheckCircle2 size={12} /> Set
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#DC2626" }}>
                    <XCircle size={12} /> Missing
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="rounded-lg p-6" style={{ border: "2px solid #FCA5A5", background: "#FEF2F2" }}>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "#DC2626" }}>Danger zone</h2>
        <p className="text-xs mb-4" style={{ color: "#991B1B" }}>These actions are destructive and cannot be undone.</p>
        <button onClick={() => setShowReset(true)}
          className="text-xs font-medium px-4 py-2 rounded-md text-white" style={{ background: "#DC2626" }}>
          Reset all feature flags
        </button>
      </div>

      <ConfirmModal isOpen={showReset} onClose={() => setShowReset(false)} onConfirm={handleReset}
        title="Reset all feature flags?" description="This will disable AI detection, Shopify, Knowledge Base, and Smart Replies for ALL users. Existing data is preserved."
        confirmLabel="Reset all flags" confirmColor="danger" loading={resetting} />
    </div>
  );
}
