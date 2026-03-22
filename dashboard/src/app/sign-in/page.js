"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight, Instagram } from "lucide-react";
import { signIn } from "./actions";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { isPersonalEmail } from "@/lib/blockedEmailDomains";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailBlocked, setEmailBlocked] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.target);
    const result = await signIn(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      router.push(result.isConnected ? "/dashboard" : "/onboarding");
    }
  }

  return (
    <div
      className="theme-transition min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none"
        style={{ backgroundColor: 'var(--primary-light)' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none"
        style={{ backgroundColor: 'var(--primary-light)' }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--primary)', boxShadow: '0 10px 15px -3px var(--primary-glow)' }}
          >
            <Bot className="text-white" size={24} />
          </div>
          <span className="text-xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Engagr</span>
        </div>

        <div
          className="theme-transition rounded-[32px] p-10 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.07)] space-y-8"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
            <p className="font-medium text-sm" style={{ color: 'var(--text-placeholder)' }}>
              New here?{" "}
              <Link href="/sign-up" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>
                Create an account
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

          {/* Google Sign In */}
          <GoogleSignInButton
            text="signin_with"
            onSuccess={(data) => {
              if (data.needsAccountType) window.location.href = "/onboarding/account-type";
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
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  autoFocus
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
                  <p className="text-sm font-medium" style={{ color: 'var(--warning-dark)' }}>Use Google Sign-In</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
                    Personal email login uses Google. Click the Sign in with Google button above.
                  </p>
                </div>
              )}
              {!emailBlocked && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-placeholder)' }}>Work email required. Use Google Sign-In for personal emails.</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>After login</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{
              background: 'linear-gradient(to right, var(--primary-light), var(--primary-light))',
              border: '1px solid var(--primary-light)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(to top right, var(--accent), var(--primary), var(--primary-dark))' }}
            >
              <Instagram size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black leading-none mb-0.5" style={{ color: 'var(--text-primary)' }}>Connect Instagram</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-placeholder)' }}>You&apos;ll link your business account after login</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
