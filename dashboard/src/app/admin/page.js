import { ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
import { adminLogin } from "./actions";

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;
  const hasError = params?.error === "1";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 theme-transition"
      style={{ backgroundColor: "var(--admin-bg)" }}
    >
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mx-auto"
            style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
          >
            <ShieldCheck style={{ color: "var(--primary)" }} size={30} />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--admin-text-primary)" }}>Admin Access</h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>Enter your admin key to continue</p>
        </div>

        <div
          className="rounded-[24px] p-8 space-y-5 shadow-sm"
          style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
        >
          {hasError && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: "var(--error-light)", border: "1px solid var(--error)", color: "var(--error)" }}
            >
              <AlertCircle size={16} />
              Invalid admin key. Try again.
            </div>
          )}

          <form action={adminLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--admin-text-muted)" }} />
              <input
                type="password"
                name="key"
                placeholder="Enter admin key"
                required
                autoFocus
                className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none transition-all"
                style={{
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--input-text)",
                }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg"
              style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
            >
              Access Dashboard
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] uppercase tracking-widest font-bold" style={{ color: "var(--admin-text-muted)" }}>
          Engagr · Admin Panel
        </p>
      </div>
    </div>
  );
}
