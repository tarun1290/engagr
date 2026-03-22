"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Mail, Lock, User, AtSign, Eye, EyeOff, ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { signUp } from "./actions";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { isPersonalEmail } from "@/lib/blockedEmailDomains";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [emailBlocked, setEmailBlocked] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.target);
    const result = await signUp(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      router.push("/onboarding");
    }
  }

  const strengthBarColor = (level) => {
    if (level === 1) return 'var(--error)';
    if (level === 2) return 'var(--warning)';
    if (level === 3) return 'var(--success)';
    return 'var(--border)';
  };

  const strengthTextColor = (level) => {
    if (level === 1) return 'var(--error)';
    if (level === 2) return 'var(--warning)';
    if (level === 3) return 'var(--success)';
    return 'var(--text-muted)';
  };

  return (
    <div className="theme-transition min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] p-12 flex-shrink-0" style={{ backgroundColor: 'var(--primary-darker)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--primary)', boxShadow: '0 10px 15px -3px rgba(var(--primary), 0.4)' }}
          >
            <Bot className="text-white" size={22} />
          </div>
          <span className="text-white font-black text-lg uppercase tracking-tight">Engagr</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 20%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary)' }} />
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Next-Gen Automation</span>
            </div>
            <h2 className="text-5xl font-black text-white leading-[1.05] tracking-tight">
              Automate your<br />
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(to right, var(--accent), var(--primary), var(--primary-dark))' }}
              >
                Instagram
              </span><br />
              in minutes.
            </h2>
            <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--text-placeholder)' }}>
              Set up automated DMs, comment replies, and engagement flows — no code required.
            </p>
          </div>

          <div className="space-y-3">
            {["Auto-reply to comments & DMs", "Detect reel shares & mentions", "Smart button & link flows"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="flex-shrink-0" style={{ color: 'var(--success)' }} />
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>&copy; 2025 Engagr Inc.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Create account</h1>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              Already have one?{" "}
              <Link href="/sign-in" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error-light)', color: 'var(--error)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--error)' }} />
              {error}
            </div>
          )}

          {/* Google Sign Up */}
          <GoogleSignInButton
            text="signup_with"
            onSuccess={(data) => {
              if (data.needsAccountType) window.location.href = "/onboarding/account-type";
              else if (data.isNewUser) window.location.href = "/onboarding";
              else window.location.href = data.isConnected ? "/dashboard" : "/onboarding";
            }}
            onError={(err) => setError(err)}
          />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-sm" style={{ color: 'var(--text-placeholder)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoFocus
                  className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                    '--tw-ring-color': 'var(--input-focus-ring)',
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  onChange={(e) => setEmailBlocked(isPersonalEmail(e.target.value))}
                  className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                    '--tw-ring-color': 'var(--input-focus-ring)',
                  }}
                />
              </div>
              {emailBlocked && (
                <div className="mt-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning-light)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--warning-dark)' }}>Work email required</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
                    Personal emails like Gmail, Yahoo, and Outlook are not accepted here. Use the Sign in with Google button above instead.
                  </p>
                </div>
              )}
              {!emailBlocked && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-placeholder)' }}>Work email required. Use Google Sign-In for personal emails.</p>
              )}
            </div>

            {/* Instagram Handle */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Instagram Handle</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  name="instagramHandle"
                  type="text"
                  placeholder="yourusername"
                  className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                    '--tw-ring-color': 'var(--input-focus-ring)',
                  }}
                />
              </div>
            </div>

            {/* Account Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Account Type</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <select
                  name="accountType"
                  required
                  className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all appearance-none"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                    '--tw-ring-color': 'var(--input-focus-ring)',
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select your account type</option>
                  <option value="creator">Creator</option>
                  <option value="business">Business</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                    '--tw-ring-color': 'var(--input-focus-ring)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{ backgroundColor: i <= passwordStrength ? strengthBarColor(passwordStrength) : 'var(--border)' }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: strengthTextColor(passwordStrength) }}
                  >
                    {strengthLabel[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  required
                  className="w-full rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                    '--tw-ring-color': 'var(--input-focus-ring)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || emailBlocked}
              className="w-full py-4 text-white rounded-2xl font-black text-base hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: 'linear-gradient(to right, var(--primary), var(--primary-dark))',
                boxShadow: '0 20px 25px -5px var(--primary-glow)',
              }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>
            Secure &middot; Private &middot; Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
