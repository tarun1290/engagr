"use client";

import { Loader2 } from "lucide-react";

export default function ToggleSwitch({ enabled, disabled = false, onChange, loading = false }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      disabled={disabled || loading}
      onClick={() => onChange?.(!enabled)}
      className="relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        width: 40,
        height: 22,
        background: disabled ? "#E4E4E7" : enabled ? "#4F46E5" : "#D4D4D8",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="inline-block rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center"
        style={{ width: 16, height: 16, transform: enabled ? "translateX(21px)" : "translateX(3px)" }}
      >
        {loading && <Loader2 size={9} className="animate-spin" style={{ color: "#A1A1AA" }} />}
      </span>
    </button>
  );
}
