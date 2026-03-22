"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, Palette, Building2, Users2 } from "lucide-react";
import { updateAccountType } from "./actions";

const ACCOUNT_TYPES = [
  {
    value: "creator",
    label: "Creator",
    description: "Content creators, influencers, and personal brands",
    icon: Palette,
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.08)",
    borderColor: "rgba(236, 72, 153, 0.2)",
  },
  {
    value: "business",
    label: "Business",
    description: "Brands, e-commerce stores, and companies",
    icon: Building2,
    color: "#4F46E5",
    bgColor: "rgba(79, 70, 229, 0.08)",
    borderColor: "rgba(79, 70, 229, 0.2)",
  },
  {
    value: "agency",
    label: "Agency",
    description: "Marketing agencies managing multiple clients",
    icon: Users2,
    color: "#0EA5E9",
    bgColor: "rgba(14, 165, 233, 0.08)",
    borderColor: "rgba(14, 165, 233, 0.2)",
  },
];

export default function AccountTypePage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setError("");
    const res = await updateAccountType(selected);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/onboarding");
    }
  }

  return (
    <div
      className="theme-transition min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none"
        style={{ backgroundColor: "var(--primary-light)" }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none"
        style={{ backgroundColor: "var(--primary-light)" }}
      />

      <div className="w-full max-w-md relative">
        {/* Branding */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: "var(--primary)",
              boxShadow: "0 10px 15px -3px var(--primary-glow)",
            }}
          >
            <Bot className="text-white" size={24} />
          </div>
          <span
            className="text-xl font-black uppercase tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Engagr
          </span>
        </div>

        {/* Card */}
        <div
          className="theme-transition rounded-[32px] p-10 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.07)] space-y-8"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="space-y-2">
            <h1
              className="text-3xl font-black tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              What describes you best?
            </h1>
            <p
              className="font-medium text-sm"
              style={{ color: "var(--text-placeholder)" }}
            >
              This helps us tailor your experience.
            </p>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
              style={{
                backgroundColor: "var(--error-light)",
                border: "1px solid var(--error-light)",
                color: "var(--error)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: "var(--error)" }}
              />
              {error}
            </div>
          )}

          <div className="space-y-3">
            {ACCOUNT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selected === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelected(type.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left"
                  style={{
                    backgroundColor: isSelected ? type.bgColor : "var(--surface-alt)",
                    border: `2px solid ${isSelected ? type.color : "var(--border)"}`,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isSelected ? type.bgColor : "var(--card)",
                      border: `1px solid ${isSelected ? type.borderColor : "var(--border)"}`,
                      color: type.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-black"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {type.label}
                    </p>
                    <p
                      className="text-[12px] font-medium"
                      style={{ color: "var(--text-placeholder)" }}
                    >
                      {type.description}
                    </p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: isSelected ? type.color : "var(--border)",
                      backgroundColor: isSelected ? type.color : "transparent",
                    }}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="w-full py-4 text-white rounded-2xl font-black text-base hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(to right, var(--primary), var(--primary-dark))",
              boxShadow: "0 20px 25px -5px var(--primary-glow)",
            }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Continue <ArrowRight size={18} />
              </>
            )}
          </button>

          <button
            onClick={() => router.push("/onboarding")}
            className="w-full py-2 text-[11px] font-bold transition-colors text-center"
            style={{ color: "var(--text-placeholder)" }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
