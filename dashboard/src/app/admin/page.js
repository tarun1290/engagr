import { ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
import { adminLogin } from "./actions";

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;
  const hasError = params?.error === "1";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-xl mx-auto border border-slate-700">
            <ShieldCheck className="text-pink-400" size={30} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Access</h1>
          <p className="text-slate-500 text-sm">Enter your admin key to continue</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-8 space-y-5">
          {hasError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-3 text-sm font-medium">
              <AlertCircle size={16} />
              Invalid admin key. Try again.
            </div>
          )}

          <form action={adminLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="password"
                name="key"
                placeholder="Enter admin key"
                required
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-primary to-pink-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-pink-900/30"
            >
              Access Dashboard
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-700 uppercase tracking-widest font-bold">
          Ai DM Bot · Admin Panel
        </p>
      </div>
    </div>
  );
}
