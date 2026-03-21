"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot, ArrowRight, CheckCircle2, AlertCircle, Instagram,
  ShieldCheck, Zap, MessageSquare, ChevronDown, ExternalLink,
} from "lucide-react";
import { getAccountsFromToken, saveDiscoveredAccount } from "../dashboard/actions";

export default function Onboarding() {
  const router = useRouter();

  const [step, setStep] = useState("connect"); // connect | success
  const [loading, setLoading] = useState(false);
  const [discoveredAccounts, setDiscoveredAccounts] = useState([]);
  const [connectedUsername, setConnectedUsername] = useState("");
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "2989539487909963";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://engagr-dm.vercel.app";

  // Must match EXACTLY what's registered in Meta App Dashboard → Valid OAuth Redirect URIs
  const redirectUri = `${appUrl}/onboarding`;

  // Handle OAuth redirect — Instagram sends ?code= back to this page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const oauthError = params.get("error");

    if (code) {
      window.history.replaceState(null, null, window.location.pathname);
      handleTokenExchange(code);
    } else if (oauthError) {
      window.history.replaceState(null, null, window.location.pathname);
      setError("Login was cancelled or permissions were not granted. Please try again.");
    }
  }, []);

  // Auto-redirect to dashboard after successful connection
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => router.push("/dashboard"), 1500);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  const handleInstagramLogin = () => {
    setError("");
    const url = new URL("https://www.instagram.com/oauth/authorize");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments");
    window.location.href = url.toString();
  };

  const handleTokenExchange = async (code) => {
    setLoading(true);
    setError("");
    try {
      const res = await getAccountsFromToken(code);

      if (res.success) {
        if (res.accounts.length === 1) {
          await handleSelectAccount(res.accounts[0]);
        } else if (res.accounts.length > 1) {
          setDiscoveredAccounts(res.accounts);
        } else {
          setError("No accounts found. Make sure your Instagram account is a Business or Creator account.");
        }
      } else {
        setError(res.error || "Could not discover accounts. Please try again.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = async (account) => {
    setLoading(true);
    setError("");
    try {
      const res = await saveDiscoveredAccount({ ...account, userToken: account.pageToken });
      if (res.success) {
        setConnectedUsername(account.username);
        setStep("success");
      } else {
        setError(res.error || "Failed to save account. Please try again.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div
        className="theme-transition min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div
          className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none"
          style={{ backgroundColor: 'var(--success-light)' }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none"
          style={{ backgroundColor: 'var(--success-light)' }}
        />

        <div className="flex flex-col items-center space-y-8 relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl animate-bounce"
            style={{
              background: 'linear-gradient(to top right, var(--success), var(--success-dark))',
              boxShadow: '0 25px 50px -12px var(--success-light)',
            }}
          >
            <CheckCircle2 className="text-white" size={48} />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Connected!</h2>
            <p className="font-bold uppercase tracking-[0.2em] text-[11px]" style={{ color: 'var(--text-placeholder)' }}>
              Automation is ready for @{connectedUsername}
            </p>
          </div>
          <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
            <div
              className="w-full h-full rounded-full animate-pulse"
              style={{ background: 'linear-gradient(to right, var(--success), var(--success-dark))' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="theme-transition min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Background blobs — matching sign-in */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none"
        style={{ backgroundColor: 'var(--primary-light)' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none"
        style={{ backgroundColor: 'var(--primary-light)' }}
      />

      <div className="w-full max-w-md relative">
        {/* Branding — matching sign-in */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--primary)', boxShadow: '0 10px 15px -3px var(--primary-glow)' }}
          >
            <Bot className="text-white" size={24} />
          </div>
          <span className="text-xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Engagr</span>
        </div>

        {/* Main card */}
        <div
          className="theme-transition rounded-[32px] p-10 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.07)] space-y-8"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Connect Instagram</h1>
            <p className="font-medium text-sm" style={{ color: 'var(--text-placeholder)' }}>
              Link your Business account to start automating DMs, replies, and engagement.
            </p>
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error-light)', color: 'var(--error)' }}
            >
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Features preview */}
            <div className="space-y-3">
              {[
                { icon: MessageSquare, text: "Auto-reply to comments with DMs", color: 'var(--info)' },
                { icon: Zap, text: "Instant follower verification gate", color: 'var(--warning)' },
                { icon: ShieldCheck, text: "Secure OAuth 2.0 connection", color: 'var(--success)' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--surface-alt)', color }}
                  >
                    <Icon size={14} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Connect button — matching sign-in gradient */}
            <button
              onClick={handleInstagramLogin}
              disabled={loading}
              className="w-full py-4 text-white rounded-2xl font-black text-base hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-60 mt-2"
              style={{
                background: 'linear-gradient(to right, var(--primary), var(--primary-dark))',
                boxShadow: '0 20px 25px -5px var(--primary-glow)',
              }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Instagram size={20} />
                  Connect with Instagram
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Account selection */}
            {discoveredAccounts.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Select Account</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                </div>
                {discoveredAccounts.map((acc) => (
                  <button
                    key={acc.igId}
                    onClick={() => handleSelectAccount(acc)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all group disabled:opacity-60"
                    style={{
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--input-border)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm"
                      style={{ background: 'linear-gradient(to top right, var(--accent), var(--primary), var(--primary-dark))' }}
                    >
                      {acc.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>@{acc.username}</p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text-placeholder)' }}>{acc.name}</p>
                    </div>
                    <ArrowRight size={14} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
                  </button>
                ))}
                <button
                  onClick={() => setDiscoveredAccounts([])}
                  className="w-full py-2 text-[11px] font-bold transition-colors"
                  style={{ color: 'var(--text-placeholder)' }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Requirements</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            </div>

            {/* Instagram Business info card */}
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
                <p className="text-sm font-black leading-none mb-0.5" style={{ color: 'var(--text-primary)' }}>Business or Creator Account</p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-placeholder)' }}>Personal accounts are not supported by Instagram API</p>
              </div>
            </div>

            {/* Skip link */}
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 text-[11px] font-bold transition-colors text-center"
              style={{ color: 'var(--text-placeholder)' }}
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-[10px] font-black transition-colors uppercase tracking-widest inline-flex items-center gap-1.5"
            style={{ color: 'var(--text-placeholder)' }}
          >
            Connection issues? <ChevronDown size={12} className={`transition-transform ${showHelp ? "rotate-180" : ""}`} />
          </button>

          {showHelp && (
            <div
              className="mt-4 rounded-2xl p-6 space-y-4 text-left"
              style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <ExternalLink size={14} />
                <p className="text-[11px] font-black uppercase tracking-tight">Troubleshooting</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[12px] font-black" style={{ color: 'var(--text-primary)' }}>1. Instagram Business Login</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>In Meta Dashboard, add the <strong>&quot;Instagram Login for Business&quot;</strong> product.</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-black" style={{ color: 'var(--text-primary)' }}>2. App Type</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Your Meta App must be <strong>&quot;Business&quot;</strong> type with Instagram permissions.</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-black" style={{ color: 'var(--text-primary)' }}>3. Redirect URI</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Add <code
                      className="px-1.5 py-0.5 rounded text-[10px]"
                      style={{ backgroundColor: 'var(--card)', color: 'var(--primary)', border: '1px solid var(--primary-light)' }}
                    >
                      {typeof window !== "undefined" ? window.location.origin : ""}/onboarding
                    </code> to Valid OAuth Redirect URIs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4"
          style={{ backgroundColor: 'var(--overlay)' }}
        >
          <div
            className="w-12 h-12 rounded-full animate-spin"
            style={{ border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)' }}
          />
          <p className="text-[11px] font-black uppercase tracking-widest animate-pulse" style={{ color: 'var(--primary)' }}>
            Connecting to Instagram...
          </p>
        </div>
      )}
    </div>
  );
}
