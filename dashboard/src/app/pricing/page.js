"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShieldCheck, Check, X as XIcon, ArrowRight, ChevronRight,
  Zap, Menu, X, HelpCircle, Sun, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { getLoggedInPlan } from "@/app/dashboard/billing-actions";

/* ─────────────────────────── CONSTANTS ─────────────────────────── */

const ACCOUNT_TYPES = [
  { key: "creator", label: "Creator", emoji: "\uD83C\uDFA8", subtitle: "For content creators and influencers" },
  { key: "business", label: "Business", emoji: "\uD83C\uDFEA", subtitle: "For e-commerce and service businesses" },
  { key: "agency", label: "Agency", emoji: "\uD83C\uDFE2", subtitle: "For social media agencies and managers" },
];

const FEATURE_LABELS = {
  commentToDm: "Comment-to-DM automation",
  followerGate: "Follower verification",
  reelShareReply: "Reel share replies",
  mentionReply: "Mention detection",
  reelCategoryRules: "Smart reel category rules",
  aiProductDetection: "AI product detection",
  smartLinks: "Tracked link analytics",
  shopifyIntegration: "Shopify integration",
  aiSmartReplies: "AI smart replies",
  knowledgeBase: "Knowledge base",
  advancedAnalytics: "Advanced analytics",
  apiAccess: "API access",
  facebookLogin: "Facebook Login",
};

const COMING_SOON_SET = new Set([
  "aiProductDetection", "smartLinks", "shopifyIntegration",
  "aiSmartReplies", "knowledgeBase", "advancedAnalytics",
  "apiAccess", "facebookLogin",
]);

const FALLBACK_PLANS = {
  creator: [
    { name: "Starter", slug: "creator_starter", price: 299, dmLimitDisplay: "5,000", maxAccounts: 1, isPopular: false, supportLevel: "email",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply"] },
    { name: "Growth", slug: "creator_growth", price: 699, dmLimitDisplay: "25,000", maxAccounts: 2, isPopular: true, supportLevel: "priority",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply", "reelCategoryRules", "aiProductDetection", "smartLinks"] },
    { name: "Pro", slug: "creator_pro", price: 1299, dmLimitDisplay: "Unlimited", maxAccounts: 2, isPopular: false, supportLevel: "priority",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply", "reelCategoryRules", "aiProductDetection", "smartLinks", "advancedAnalytics"] },
  ],
  business: [
    { name: "Essentials", slug: "business_essentials", price: 499, dmLimitDisplay: "10,000", maxAccounts: 1, isPopular: false, supportLevel: "email",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply", "reelCategoryRules"] },
    { name: "Professional", slug: "business_professional", price: 999, dmLimitDisplay: "50,000", maxAccounts: 3, isPopular: true, supportLevel: "priority",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply", "reelCategoryRules", "aiProductDetection", "smartLinks", "shopifyIntegration", "knowledgeBase"] },
    { name: "Enterprise", slug: "business_enterprise", price: 1999, dmLimitDisplay: "Unlimited", maxAccounts: 5, isPopular: false, supportLevel: "dedicated",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply", "reelCategoryRules", "aiProductDetection", "smartLinks", "shopifyIntegration", "aiSmartReplies", "knowledgeBase", "advancedAnalytics"] },
  ],
  agency: [
    { name: "Starter", slug: "agency_starter", price: 1499, dmLimitDisplay: "25,000", maxAccounts: 3, isPopular: false, supportLevel: "priority",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply", "reelCategoryRules", "aiProductDetection", "smartLinks", "knowledgeBase", "facebookLogin"] },
    { name: "Professional", slug: "agency_professional", price: 2999, dmLimitDisplay: "1,00,000", maxAccounts: 5, isPopular: true, supportLevel: "dedicated",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply", "reelCategoryRules", "aiProductDetection", "smartLinks", "shopifyIntegration", "aiSmartReplies", "knowledgeBase", "advancedAnalytics", "apiAccess", "facebookLogin"] },
    { name: "Scale", slug: "agency_scale", price: 4999, dmLimitDisplay: "Unlimited", maxAccounts: 10, isPopular: false, supportLevel: "dedicated",
      featureList: ["commentToDm", "followerGate", "reelShareReply", "mentionReply", "reelCategoryRules", "aiProductDetection", "smartLinks", "shopifyIntegration", "aiSmartReplies", "knowledgeBase", "advancedAnalytics", "apiAccess", "facebookLogin"] },
  ],
};

const FAQS = [
  {
    q: "Can I upgrade or downgrade anytime?",
    a: "Yes. You can switch between plans at any time. When you upgrade, you\u2019re charged the prorated difference. Downgrades take effect at the next billing cycle.",
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
    q: "Can I switch between Creator, Business, and Agency?",
    a: "Yes! You can change your account type at any time from Settings. Your data and automations carry over \u2014 only the plan pricing tiers change.",
  },
  {
    q: "How does the follower verification gate work?",
    a: "When enabled, non-followers who comment receive a DM with a \u2018I\u2019m following now\u2019 button. Once they follow your account and tap the button, Engagr verifies their follow status and delivers your automation message.",
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
  const [userPlan, setUserPlan] = useState(null);
  const [activeType, setActiveType] = useState("business");
  const [allPlans, setAllPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    getLoggedInPlan().then(setUserPlan).catch(() => setUserPlan({ loggedIn: false }));
  }, []);

  useEffect(() => {
    Promise.all(
      ["creator", "business", "agency"].map((type) =>
        fetch(`/api/plans/public?type=${type}`)
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(([creator, business, agency]) => {
      const fetched = {};
      if (creator?.plans?.length) fetched.creator = creator.plans;
      if (business?.plans?.length) fetched.business = business.plans;
      if (agency?.plans?.length) fetched.agency = agency.plans;
      if (Object.keys(fetched).length > 0) setAllPlans((prev) => ({ ...prev, ...fetched }));
    });
  }, []);

  const plans = allPlans[activeType] || [];
  const typeInfo = ACCOUNT_TYPES.find((t) => t.key === activeType);

  const getCtaText = (plan) => {
    if (!userPlan || !userPlan.loggedIn) return "Get Started";
    if (userPlan.plan === plan.slug) return "Current Plan";
    return "Get Started";
  };

  const getCtaHref = (plan) => {
    if (!userPlan || !userPlan.loggedIn) return `/sign-up?type=${activeType}&plan=${plan.slug}`;
    if (userPlan.plan === plan.slug) return "/dashboard";
    return "/dashboard";
  };

  const isCurrentPlan = (plan) => userPlan?.loggedIn && userPlan.plan === plan.slug;

  return (
    <div className="min-h-screen theme-transition" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <section className="pt-32 pb-10 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-3xl -z-10 pointer-events-none" style={{ background: "radial-gradient(ellipse, var(--primary-light), transparent 70%)", opacity: 0.5 }} />

        {/* [PLANS DISABLED] Early Access banner */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ backgroundColor: "var(--success-light)", border: "1px solid var(--success)" }}
        >
          <Zap size={13} style={{ color: "var(--success)" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--success)" }}>Early Access</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
          Simple, transparent pricing
        </h1>
        <p className="text-base sm:text-lg font-medium max-w-lg mx-auto mb-2" style={{ color: "var(--text-muted)" }}>
          Choose your path. All features free during Early Access.
        </p>
      </section>

      {/* ── ACCOUNT TYPE TABS ─────────────────────────────────── */}
      <section className="px-6 pb-6">
        <div className="flex justify-center mb-3">
          <div className="inline-flex p-1 rounded-full" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
            {ACCOUNT_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => setActiveType(type.key)}
                className="px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200"
                style={activeType === type.key
                  ? { backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", boxShadow: "0 4px 12px var(--primary-light)" }
                  : { color: "var(--text-muted)" }
                }
              >
                <span className="mr-1.5">{type.emoji}</span>{type.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-sm" style={{ color: "var(--text-placeholder)" }}>
          {typeInfo?.subtitle}
        </p>
      </section>

      {/* ── PLAN CARDS ─────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div key={activeType} className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ animation: "priceFadeIn 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
          {plans.map((plan) => {
            const priceDisplay = typeof plan.priceDisplay === "string"
              ? plan.priceDisplay
              : `\u20B9${(plan.price || 0).toLocaleString("en-IN")}`;
            const features = (plan.featureList || []).map((f) => {
              const key = typeof f === "string" ? f : f;
              return { key, label: FEATURE_LABELS[key] || key, soon: COMING_SOON_SET.has(key) };
            });

            return (
              <div
                key={plan.slug}
                className={cn(
                  "relative rounded-[32px] p-8 flex flex-col transition-all hover:-translate-y-1 duration-300",
                  plan.isPopular ? "shadow-lg" : ""
                )}
                style={{
                  backgroundColor: "var(--card)",
                  border: plan.isPopular ? "1px solid var(--primary-medium)" : "1px solid var(--border)",
                  boxShadow: plan.isPopular ? "0 4px 24px var(--primary-light)" : undefined,
                }}
              >
                {plan.isPopular && (
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
                  <h3 className="text-lg font-black mb-1" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-placeholder)" }}>
                    <span>{plan.dmLimitDisplay || "10,000"} DMs/mo</span>
                    <span>&middot;</span>
                    <span>{plan.maxAccounts || 1} account{(plan.maxAccounts || 1) > 1 ? "s" : ""}</span>
                    <span>&middot;</span>
                    <span className="capitalize">{plan.supportLevel || "email"}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{priceDisplay}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-placeholder)" }}>/month</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-placeholder)" }}>+ GST where applicable</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f.key} className="flex items-start gap-3">
                      <Check size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--success)" }} />
                      <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                        {f.label}
                        {f.soon && (
                          <span className="ml-1.5 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(45, 212, 191, 0.1)", color: "var(--success)" }}>soon</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={getCtaHref(plan)}
                  className={cn(
                    "w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                    isCurrentPlan(plan) && "opacity-60 pointer-events-none"
                  )}
                  style={
                    isCurrentPlan(plan)
                      ? { backgroundColor: "var(--surface-alt)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                      : plan.isPopular
                      ? { backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", boxShadow: "0 4px 16px var(--primary-light)" }
                      : { backgroundColor: "var(--text-primary)", color: "var(--bg)" }
                  }
                >
                  {getCtaText(plan)} {!isCurrentPlan(plan) && <ArrowRight size={15} />}
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

        {/* Early access banner */}
        <div className="max-w-2xl mx-auto mt-10 text-center">
          <p className="text-sm" style={{ color: "var(--text-placeholder)" }}>
            {"\u2728"} Currently in early access \u2014 all features free for all account types. No credit card needed.
          </p>
        </div>
      </section>

      {/* ── PLAN COMPARISON TABLE ─────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: "var(--surface-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10 tracking-tight" style={{ color: "var(--text-primary)" }}>
            {typeInfo?.emoji} {typeInfo?.label} Plan Comparison
          </h2>

          <div
            key={`table-${activeType}`}
            className="rounded-[24px] overflow-hidden shadow-sm"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", animation: "priceFadeIn 0.35s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface-alt)" }}>
                  <th className="text-left py-4 px-6 text-[11px] font-black uppercase tracking-widest w-1/3" style={{ color: "var(--text-placeholder)" }}>Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.slug} className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest"
                      style={{ color: plan.isPopular ? "var(--primary)" : "var(--text-muted)" }}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* DM limit row */}
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <td className="py-3.5 px-6 text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>Monthly DM limit</td>
                  {plans.map((p) => (
                    <td key={p.slug} className="py-3.5 px-4 text-center">
                      <span className="text-[13px] font-bold" style={{ color: "var(--text-secondary)" }}>{p.dmLimitDisplay}</span>
                    </td>
                  ))}
                </tr>
                {/* Accounts row */}
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface-alt)" }}>
                  <td className="py-3.5 px-6 text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>Instagram accounts</td>
                  {plans.map((p) => (
                    <td key={p.slug} className="py-3.5 px-4 text-center">
                      <span className="text-[13px] font-bold" style={{ color: "var(--text-secondary)" }}>{p.maxAccounts}</span>
                    </td>
                  ))}
                </tr>
                {/* Feature rows */}
                {Object.entries(FEATURE_LABELS).map(([key, label], i) => (
                  <tr
                    key={key}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      backgroundColor: i % 2 === 0 ? "var(--card)" : "var(--surface-alt)",
                    }}
                  >
                    <td className="py-3.5 px-6 text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {label}
                      {COMING_SOON_SET.has(key) && (
                        <span className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(45, 212, 191, 0.1)", color: "var(--success)" }}>Soon</span>
                      )}
                    </td>
                    {plans.map((p) => {
                      const has = (p.featureList || []).includes(key);
                      return (
                        <td key={p.slug} className="py-3.5 px-4 text-center">
                          {has ? (
                            <Check size={16} className="mx-auto" style={{ color: "var(--success)" }} />
                          ) : (
                            <XIcon size={16} className="mx-auto" style={{ color: "var(--text-placeholder)" }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Support row */}
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-3.5 px-6 text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>Support</td>
                  {plans.map((p) => (
                    <td key={p.slug} className="py-3.5 px-4 text-center">
                      <span className="text-[13px] font-bold capitalize" style={{ color: "var(--text-secondary)" }}>{p.supportLevel}</span>
                    </td>
                  ))}
                </tr>
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
              Get Started \u2014 It&apos;s Free
            </h2>
            <p className="text-base font-medium max-w-md mx-auto mb-8" style={{ color: "var(--primary-medium)" }}>
              No credit card required. All features unlocked during Early Access. Set up your first automation in under 3 minutes.
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
                Next-generation Instagram automation for creators, businesses, and agencies.
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
              <ShieldCheck size={13} style={{ color: "var(--primary-medium)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--primary-medium)" }}>Built on Meta Instagram API</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Animation keyframes */}
      <style>{`
        @keyframes priceFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
