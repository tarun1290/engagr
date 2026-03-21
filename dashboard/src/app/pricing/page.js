"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShieldCheck, Check, X as XIcon, ArrowRight, ChevronRight,
  Instagram, Zap, Crown, Gem, Star, Menu, X, HelpCircle, Sun, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { getLoggedInPlan } from "@/app/dashboard/billing-actions";

/* ─────────────────────────── ICONS ─────────────────────────── */

const SilverShield = ({ size, className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
);

/* ─────────────────────────── PLAN DATA ─────────────────────────── */

const PLANS = [
  {
    id: "silver",
    name: "Silver",
    icon: SilverShield,
    price: 499,
    period: "month",
    tagline: "Perfect for creators just getting started",
    tierColors: {
      iconBg: "var(--surface-alt)",
      iconColor: "var(--text-muted)",
      borderColor: "var(--border)",
    },
    features: [
      { text: "1 Instagram account", included: true },
      { text: "Comment-to-DM automation", included: true },
      { text: "500 automated DMs per month", included: true },
      { text: "Smart reply presets", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "Reel share detection", included: true },
      { text: "Email support", included: true },
      { text: "Follower verification gate", included: false },
      { text: "Mentions tracker", included: false },
      { text: "Contact management", included: false },
      { text: "Activity feed & logs", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Start with Silver",
  },
  {
    id: "gold",
    name: "Gold",
    icon: Crown,
    price: 999,
    period: "month",
    tagline: "For growing businesses that want every feature",
    tierColors: {
      iconBg: "var(--warning-light)",
      iconColor: "var(--warning)",
      borderColor: "var(--warning-light)",
    },
    popular: true,
    features: [
      { text: "1 Instagram account", included: true },
      { text: "Comment-to-DM automation", included: true },
      { text: "Unlimited automated DMs", included: true },
      { text: "Smart reply presets", included: true },
      { text: "Advanced analytics & trends", included: true },
      { text: "Reel share detection", included: true },
      { text: "Follower verification gate", included: true },
      { text: "Mentions tracker", included: true },
      { text: "Contact management", included: true },
      { text: "Activity feed & logs", included: true },
      { text: "Priority email support", included: true },
      { text: "Multiple accounts", included: false },
    ],
    cta: "Start with Gold",
  },
  {
    id: "platinum",
    name: "Platinum",
    icon: Gem,
    price: 1499,
    period: "month",
    tagline: "For agencies and brands managing multiple accounts",
    tierColors: {
      iconBg: "var(--primary-light)",
      iconColor: "var(--primary)",
      borderColor: "var(--primary-light)",
    },
    features: [
      { text: "Up to 5 Instagram accounts", included: true },
      { text: "Comment-to-DM automation", included: true },
      { text: "Unlimited automated DMs", included: true },
      { text: "Smart reply presets", included: true },
      { text: "Advanced analytics & trends", included: true },
      { text: "Reel share detection", included: true },
      { text: "Follower verification gate", included: true },
      { text: "Mentions tracker", included: true },
      { text: "Contact management", included: true },
      { text: "Activity feed & logs", included: true },
      { text: "API access & white-label", included: true },
      { text: "Custom automation templates", included: true },
    ],
    cta: "Start with Platinum",
  },
];

const FAQS = [
  {
    q: "Can I upgrade or downgrade anytime?",
    a: "Yes. You can switch between plans at any time. When you upgrade, you're charged the prorated difference. Downgrades take effect at the next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! Every plan comes with a 7-day free trial. No credit card required to start. You can explore all features before committing.",
  },
  {
    q: "Do I need a Facebook Page to use Engagr?",
    a: "No. Engagr uses Instagram Business Login (API with Instagram Login), which connects directly to your Instagram account without requiring a Facebook Page.",
  },
  {
    q: "What happens when I hit the DM limit on Silver?",
    a: "You'll receive a notification when you're approaching 500 DMs. After the limit, new comments won't trigger DMs until the next billing cycle — or you can upgrade to Gold for unlimited DMs.",
  },
  {
    q: "How does the follower verification gate work?",
    a: "When enabled, non-followers who comment receive a DM with a 'I'm following now' button. Once they follow your account and tap the button, Engagr verifies their follow status and delivers your automation message.",
  },
  {
    q: "Is my Instagram data safe?",
    a: "Absolutely. Engagr uses official Meta APIs with encrypted tokens. We never store your Instagram password and all data is transmitted over HTTPS. You can revoke access at any time.",
  },
];

/* ─────────────────────────── COMPONENTS ─────────────────────────── */

function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl theme-transition"
      style={{
        backgroundColor: "color-mix(in srgb, var(--card) 80%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <ShieldCheck className="text-white" size={17} />
          </div>
          <span className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>Engagr</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-semibold transition-colors" style={{ color: "var(--text-muted)" }}>Features</Link>
          <Link href="/#case-studies" className="text-sm font-semibold transition-colors" style={{ color: "var(--text-muted)" }}>Case Studies</Link>
          <Link href="/pricing" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>Pricing</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-alt)"; e.currentTarget.style.color = "var(--primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/sign-in" className="px-5 py-2 text-sm font-bold transition-colors" style={{ color: "var(--text-secondary)" }}>Sign In</Link>
          <Link
            href="/sign-up"
            className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-lg"
            style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
          >
            Get Started Free
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2" style={{ color: "var(--text-secondary)" }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden px-6 py-6 space-y-4"
          style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border)" }}
        >
          <Link href="/#features" className="block text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Features</Link>
          <Link href="/#case-studies" className="block text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Case Studies</Link>
          <Link href="/pricing" className="block text-sm font-semibold" style={{ color: "var(--primary)" }}>Pricing</Link>
          <div className="pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <Link
              href="/sign-in"
              className="text-center py-3 text-sm font-bold rounded-xl"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-center py-3 text-sm font-bold rounded-xl"
              style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ border: "1px solid var(--border)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors"
      >
        <span className="text-[14px] font-bold pr-4" style={{ color: "var(--text-primary)" }}>{q}</span>
        <ChevronRight size={16} className={cn("flex-shrink-0 transition-transform", open && "rotate-90")} style={{ color: "var(--text-placeholder)" }} />
      </button>
      {open && (
        <div className="px-6 pb-5 -mt-1">
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── PAGE ─────────────────────────── */

export default function PricingPage() {
  const [userPlan, setUserPlan] = useState(null); // null = loading, { loggedIn: false } = guest

  useEffect(() => {
    getLoggedInPlan().then(setUserPlan).catch(() => setUserPlan({ loggedIn: false }));
  }, []);

  const getCtaText = (planId) => {
    if (!userPlan || !userPlan.loggedIn) return PLANS.find(p => p.id === planId)?.cta || "Get Started";
    if (userPlan.plan === planId) return "Current Plan";
    const planOrder = ["trial", "silver", "gold", "platinum"];
    return planOrder.indexOf(planId) > planOrder.indexOf(userPlan.plan) ? `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}` : `Switch to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`;
  };

  const getCtaHref = (planId) => {
    if (!userPlan || !userPlan.loggedIn) return "/sign-up";
    if (userPlan.plan === planId) return "/dashboard";
    return "/dashboard"; // navigates to billing
  };

  const isCurrentPlan = (planId) => userPlan?.loggedIn && userPlan.plan === planId;

  return (
    <div className="min-h-screen theme-transition" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-3xl -z-10 pointer-events-none" style={{ background: "radial-gradient(ellipse, var(--primary-light), transparent 70%)", opacity: 0.5 }} />

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ backgroundColor: "var(--primary-light)", border: "1px solid var(--primary-medium)" }}
        >
          <Zap size={13} style={{ color: "var(--primary)" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>Simple Pricing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
          Choose Your Plan
        </h1>
        <p className="text-base sm:text-lg font-medium max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
          Start with a 7-day free trial on any plan. No credit card required. Upgrade, downgrade, or cancel anytime.
        </p>
      </section>

      {/* ── PLAN CARDS ─────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-[32px] p-8 flex flex-col transition-all hover:-translate-y-1 duration-300",
                  plan.popular ? "shadow-lg" : ""
                )}
                style={{
                  backgroundColor: "var(--card)",
                  border: plan.popular ? "1px solid var(--primary-medium)" : "1px solid var(--border)",
                  boxShadow: plan.popular ? "0 4px 24px var(--primary-light)" : undefined,
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div
                      className="px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg"
                      style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
                    >
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{
                        backgroundColor: plan.tierColors.iconBg,
                        border: `1px solid ${plan.tierColors.borderColor}`,
                      }}
                    >
                      <PlanIcon size={20} style={{ color: plan.tierColors.iconColor }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                    </div>
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-placeholder)" }}>{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-bold" style={{ color: "var(--text-placeholder)" }}>&#8377;</span>
                    <span className="text-5xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{plan.price.toLocaleString("en-IN")}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-placeholder)" }}>/{plan.period}</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-placeholder)" }}>+ GST where applicable</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-3">
                      {f.included ? (
                        <Check size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--success)" }} />
                      ) : (
                        <XIcon size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-placeholder)" }} />
                      )}
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: f.included ? "var(--text-secondary)" : "var(--text-placeholder)" }}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={getCtaHref(plan.id)}
                  className={cn(
                    "w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                    isCurrentPlan(plan.id) && "opacity-60 pointer-events-none"
                  )}
                  style={
                    isCurrentPlan(plan.id)
                      ? { backgroundColor: "var(--surface-alt)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                      : plan.popular
                      ? { backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", boxShadow: "0 4px 16px var(--primary-light)" }
                      : { backgroundColor: "var(--text-primary)", color: "var(--bg)" }
                  }
                >
                  {getCtaText(plan.id)} {!isCurrentPlan(plan.id) && <ArrowRight size={15} />}
                </Link>
              </div>
            );
          })}
        </div>

        {/* All plans include */}
        <div className="max-w-3xl mx-auto mt-14 text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: "var(--text-placeholder)" }}>All plans include</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {[
              "7-day free trial",
              "SSL encrypted",
              "Official Meta APIs",
              "No Facebook Page required",
              "Cancel anytime",
              "Auto-updates",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check size={13} style={{ color: "var(--success)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ───────────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: "var(--surface-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10 tracking-tight" style={{ color: "var(--text-primary)" }}>Plan Comparison</h2>

          <div
            className="rounded-[24px] overflow-hidden shadow-sm"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface-alt)" }}>
                  <th className="text-left py-4 px-6 text-[11px] font-black uppercase tracking-widest w-1/3" style={{ color: "var(--text-placeholder)" }}>Feature</th>
                  <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Silver</th>
                  <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--warning)" }}>Gold</th>
                  <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>Platinum</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Instagram accounts", silver: "1", gold: "1", platinum: "5" },
                  { feature: "Monthly DM limit", silver: "500", gold: "Unlimited", platinum: "Unlimited" },
                  { feature: "Comment-to-DM", silver: true, gold: true, platinum: true },
                  { feature: "Smart reply presets", silver: true, gold: true, platinum: true },
                  { feature: "Reel share detection", silver: true, gold: true, platinum: true },
                  { feature: "Follower verification gate", silver: false, gold: true, platinum: true },
                  { feature: "Mentions tracker", silver: false, gold: true, platinum: true },
                  { feature: "Contact management", silver: false, gold: true, platinum: true },
                  { feature: "Activity feed & logs", silver: false, gold: true, platinum: true },
                  { feature: "Analytics", silver: "Basic", gold: "Advanced", platinum: "Advanced" },
                  { feature: "Custom templates", silver: false, gold: false, platinum: true },
                  { feature: "Support", silver: "Email", gold: "Priority", platinum: "Dedicated" },
                ].map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      backgroundColor: i % 2 === 0 ? "var(--card)" : "var(--surface-alt)",
                    }}
                  >
                    <td className="py-3.5 px-6 text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>{row.feature}</td>
                    {["silver", "gold", "platinum"].map((plan) => {
                      const val = row[plan];
                      return (
                        <td key={plan} className="py-3.5 px-4 text-center">
                          {val === true ? (
                            <Check size={16} className="mx-auto" style={{ color: "var(--success)" }} />
                          ) : val === false ? (
                            <XIcon size={16} className="mx-auto" style={{ color: "var(--text-placeholder)" }} />
                          ) : (
                            <span className="text-[13px] font-bold" style={{ color: "var(--text-secondary)" }}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
            >
              <HelpCircle size={13} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>FAQ</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div
          className="max-w-4xl mx-auto rounded-[32px] p-10 sm:p-14 text-center relative overflow-hidden"
          style={{ backgroundColor: "var(--primary-darker)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, var(--primary-glow), transparent 60%)" }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
              Start Your Free Trial Today
            </h2>
            <p className="text-base font-medium max-w-md mx-auto mb-8" style={{ color: "var(--primary-medium)" }}>
              7 days free on any plan. No credit card required. Set up your first automation in under 3 minutes.
            </p>
            <Link
              href={userPlan?.loggedIn ? "/dashboard" : "/sign-up"}
              className="inline-flex items-center gap-2 px-10 py-4 font-bold text-base rounded-2xl transition-all shadow-xl"
              style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
            >
              {userPlan?.loggedIn ? "Go to Dashboard" : "Get Started Free"} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: "var(--primary-darker)", color: "white" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  <ShieldCheck className="text-white" size={17} />
                </div>
                <span className="text-lg font-black uppercase tracking-tight">Engagr</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--primary-medium)" }}>
                Next-generation Instagram automation for businesses that want to turn every comment into a conversion.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--primary-medium)" }}>Product</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "var(--primary-medium)" }}>
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/#case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--primary-medium)" }}>Account</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "var(--primary-medium)" }}>
                <li><Link href="/sign-in" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/sign-up" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--primary-medium)" }}>Legal</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "var(--primary-medium)" }}>
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
                <li><Link href="/data-deletion-status" className="hover:text-white transition-colors">Data Deletion</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid var(--primary-dark)" }}>
            <p className="text-xs" style={{ color: "var(--primary-medium)" }}>&copy; {new Date().getFullYear()} Engagr. All rights reserved.</p>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "var(--primary-dark)", border: "1px solid var(--primary-medium)" }}
            >
              <Instagram size={13} style={{ color: "var(--primary-medium)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--primary-medium)" }}>Built on Meta Instagram API</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
