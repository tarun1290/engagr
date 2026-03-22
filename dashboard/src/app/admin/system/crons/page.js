"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import StatCard from "../../components/StatCard";
import { adminGetCronStatus } from "../../admin-actions";

const STATUS_STYLES = {
  active: { bg: "#ECFDF5", color: "#059669", label: "Active" },
  disabled: { bg: "#FFFBEB", color: "#D97706", label: "Disabled" },
  running: { bg: "#EFF6FF", color: "#2563EB", label: "Running" },
  failed: { bg: "#FEF2F2", color: "#DC2626", label: "Failed" },
};

export default function CronJobsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetCronStatus().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#94A3B8" }} /></div>;

  const jobs = data?.jobs || [];
  const activeCount = jobs.filter(j => j.status === "active").length;
  const disabledCount = jobs.filter(j => j.status === "disabled").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Cron jobs</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>Scheduled tasks and their statuses</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active crons" value={activeCount} icon={Clock} />
        <StatCard label="Disabled crons" value={disabledCount} />
        <StatCard label="Last cron run" value="N/A" />
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Job</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Schedule</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Cron</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Status</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>Code tag</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => {
                const s = STATUS_STYLES[job.status] || STATUS_STYLES.disabled;
                return (
                  <tr key={i} style={{ borderTop: "1px solid #F1F5F9" }}>
                    <td className="px-5 py-3 font-medium" style={{ color: "#0F172A" }}>{job.name}</td>
                    <td className="px-5 py-3" style={{ color: "#475569" }}>{job.schedule}</td>
                    <td className="px-5 py-3"><code className="text-xs font-mono" style={{ color: "#94A3B8" }}>{job.cron}</code></td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
                        {job.status === "running" && <span className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ background: s.color }} />}
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {job.tag ? <code className="text-xs font-mono" style={{ color: "#64748B" }}>{job.tag}</code> : <span style={{ color: "#CBD5E1" }}>—</span>}
                    </td>
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
