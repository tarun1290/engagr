import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  let isLoggedIn = false;
  if (token) {
    const payload = await verifyToken(token);
    isLoggedIn = !!payload;
  }

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
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-pink-100 flex items-center gap-2"
            >
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              href="/onboarding"
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-pink-100 flex items-center gap-2"
            >
              Login <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8">
        <Hero isLoggedIn={isLoggedIn} />
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
