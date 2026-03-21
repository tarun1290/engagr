"use client";

import { useState } from "react";
import { Crown, Zap, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminChangePlan, adminGrantDms, adminExtendTrial } from "@/app/admin/actions";

export default function AdminUserActions({ userId, currentPlan }) {
  const router = useRouter();
  const [action, setAction] = useState(null); // "plan" | "dms" | "trial"
  const [loading, setLoading] = useState(false);
  const [planValue, setPlanValue] = useState(currentPlan || "trial");
  const [dmsValue, setDmsValue] = useState("100");
  const [daysValue, setDaysValue] = useState("7");
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      let res;
      if (action === "plan") {
        res = await adminChangePlan(userId, planValue);
      } else if (action === "dms") {
        res = await adminGrantDms(userId, parseInt(dmsValue));
      } else if (action === "trial") {
        res = await adminExtendTrial(userId, parseInt(daysValue));
      }

      if (res?.success) {
        setFeedback({ type: "success", msg: action === "plan" ? `Set to ${planValue}` : action === "dms" ? `+${dmsValue} DMs` : `+${daysValue} days` });
        setAction(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", msg: res?.error || "Failed" });
      }
    } catch (err) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
      <span
        className="text-[10px] font-bold"
        style={{ color: feedback.type === "success" ? "var(--success)" : "var(--error)" }}
      >
        {feedback.msg}
      </span>
    );
  }

  if (action) {
    return (
      <div className="flex items-center gap-1.5">
        {action === "plan" && (
          <select
            value={planValue}
            onChange={(e) => setPlanValue(e.target.value)}
            className="rounded px-1.5 py-0.5 text-[10px] font-bold outline-none"
            style={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)", color: "var(--admin-text-primary)" }}
          >
            <option value="trial">Trial</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        )}
        {action === "dms" && (
          <input
            type="number"
            value={dmsValue}
            onChange={(e) => setDmsValue(e.target.value)}
            className="w-16 rounded px-1.5 py-0.5 text-[10px] font-bold outline-none"
            style={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)", color: "var(--admin-text-primary)" }}
            min="1"
          />
        )}
        {action === "trial" && (
          <input
            type="number"
            value={daysValue}
            onChange={(e) => setDaysValue(e.target.value)}
            className="w-14 rounded px-1.5 py-0.5 text-[10px] font-bold outline-none"
            style={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)", color: "var(--admin-text-primary)" }}
            min="1"
          />
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-2 py-0.5 rounded text-[10px] font-bold transition-all disabled:opacity-60"
          style={{ backgroundColor: "var(--success-light)", color: "var(--success)", border: "1px solid var(--success)" }}
        >
          {loading ? "..." : "Go"}
        </button>
        <button
          onClick={() => setAction(null)}
          disabled={loading}
          className="px-2 py-0.5 rounded text-[10px] font-bold"
          style={{ backgroundColor: "var(--admin-card)", color: "var(--admin-text-muted)", border: "1px solid var(--admin-border)" }}
        >
          X
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setAction("plan")}
        className="p-1 rounded-lg transition-all"
        style={{ color: "var(--admin-text-muted)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--warning)"; e.currentTarget.style.backgroundColor = "var(--warning-light)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--admin-text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
        title="Change plan"
      >
        <Crown size={12} />
      </button>
      <button
        onClick={() => setAction("dms")}
        className="p-1 rounded-lg transition-all"
        style={{ color: "var(--admin-text-muted)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.backgroundColor = "var(--primary-light)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--admin-text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
        title="Grant bonus DMs"
      >
        <Zap size={12} />
      </button>
      {(currentPlan === "trial" || !currentPlan) && (
        <button
          onClick={() => setAction("trial")}
          className="p-1 rounded-lg transition-all"
          style={{ color: "var(--admin-text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--info)"; e.currentTarget.style.backgroundColor = "var(--info-light)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--admin-text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
          title="Extend trial"
        >
          <Clock size={12} />
        </button>
      )}
    </div>
  );
}
