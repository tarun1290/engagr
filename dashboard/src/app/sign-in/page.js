"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight, Instagram } from "lucide-react";
import { signIn } from "./actions";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-pink-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
            <Bot className="text-white" size={24} />
          </div>
          <span className="text-xl font-black text-slate-900 uppercase tracking-tight">Ai DM Bot</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.07)] space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-400 font-medium text-sm">
              New here?{" "}
              <Link href="/sign-up" className="text-primary font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#FF3040] to-[#E5266E] text-white rounded-2xl font-black text-base hover:opacity-90 transition-all shadow-xl shadow-pink-200 flex items-center justify-center gap-3 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">After login</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFDA3A] via-[#FF3040] to-[#E5266E] flex items-center justify-center flex-shrink-0">
              <Instagram size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 leading-none mb-0.5">Connect Instagram</p>
              <p className="text-[11px] text-slate-400 font-medium">You&apos;ll link your business account after login</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
