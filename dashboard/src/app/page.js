"use client";

import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-[family-name:var(--font-inter)]">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-pink-100">
            <Bot className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tight uppercase">Ai DM Bot</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-pink-100 flex items-center gap-2"
          >
            Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8">
        <Hero />
        <Features />
      </main>
      
      <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-slate-100 mt-40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Bot className="text-primary" size={20} />
            <span className="font-bold tracking-tight uppercase text-sm">Ai DM Bot</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 Ai DM Bot Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
