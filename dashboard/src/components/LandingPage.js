"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   ENGAGR LANDING PAGE — Dark-first, premium, cinematic design
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Scroll-triggered fade-in animation hook ─────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const children = el.querySelectorAll("[data-reveal]");
          children.forEach((child, i) => {
            setTimeout(() => {
              child.style.opacity = "1";
              child.style.transform = "translateY(0)";
            }, i * 100);
          });
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const revealStyle = {
  opacity: 0,
  transform: "translateY(30px)",
  transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
};

// ── Shared components ───────────────────────────────────────────────────────

function GradientText({ children, className = "", alt = false }) {
  return (
    <span
      className={className}
      style={{
        background: alt
          ? "linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #F472B6 100%)"
          : "linear-gradient(135deg, #FAFAFA 0%, #818CF8 50%, #2DD4BF 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

function SectionEyebrow({ children }) {
  return (
    <p className="text-xs tracking-[0.2em] uppercase font-semibold mb-4" style={{ color: "#818CF8" }}>
      {children}
    </p>
  );
}

function GlassCard({ children, className = "", featured = false, onClick }) {
  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-300 ${className}`}
      style={{
        background: "rgba(24, 24, 27, 0.6)",
        backdropFilter: "blur(12px)",
        border: featured ? "1px solid rgba(129, 140, 248, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: featured ? "0 8px 32px rgba(129, 140, 248, 0.1)" : "none",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = featured ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(129, 140, 248, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = featured ? "rgba(129, 140, 248, 0.3)" : "rgba(255, 255, 255, 0.06)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = featured ? "0 8px 32px rgba(129, 140, 248, 0.1)" : "none";
      }}
    >
      {children}
    </div>
  );
}

function ComingSoonBadge() {
  return (
    <span
      className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(45, 212, 191, 0.1)", border: "1px solid rgba(45, 212, 191, 0.2)", color: "#2DD4BF" }}
    >
      Coming soon
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="rgba(52, 211, 153, 0.15)" />
      <path d="M5 8l2 2 4-4" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Feature data ────────────────────────────────────────────────────────────

const FEATURES = {
  automation: {
    label: "Automation",
    items: [
      { title: "Comment triggers", desc: "Someone comments a keyword? Instantly DM them your offer, link, or content. Multi-step flows with custom triggers.", icon: "💬" },
      { title: "Follower verification", desc: "Only DM people who follow you. Filter out bots and drive real follows before delivering content.", icon: "🛡️" },
      { title: "Reel share replies", desc: "When someone shares your reel, auto-reply with a thank you, link, or product recommendation.", icon: "🎬" },
      { title: "Story mention replies", desc: "Get mentioned in a story? Automatically thank them and send a reward, discount, or content.", icon: "📣" },
    ],
  },
  commerce: {
    label: "AI Commerce",
    items: [
      { title: "AI product recognition", desc: "AI identifies products in shared reels — shoes, clothing, food — and sends a purchase link automatically.", icon: "✨", soon: true },
      { title: "Tracked links & analytics", desc: "Every link wrapped in a tracked URL. See clicks, devices, countries, and conversions in real-time.", icon: "🔗", soon: true },
      { title: "Shopify catalog sync", desc: "Connect your Shopify store. AI recommends your products with prices, images, and direct purchase links.", icon: "🛍️", soon: true },
      { title: "AI-powered DM support", desc: "AI reads your catalog and knowledge base to answer questions, recommend products, and handle support 24/7.", icon: "🧠", soon: true },
    ],
  },
  intelligence: {
    label: "Intelligence",
    items: [
      { title: "Contact profiles", desc: "Every interaction builds a profile — DMs, comments, products asked about, full engagement history.", icon: "👥" },
      { title: "Real-time activity log", desc: "See every comment, DM, reel share, and AI interaction as it happens. Filter by type, date, or contact.", icon: "📊" },
      { title: "Knowledge base", desc: "Upload PDFs, add website URLs. AI learns your return policies, FAQs, and product details.", icon: "📚", soon: true },
      { title: "Deep analytics", desc: "Engagement trends, best-performing posts, peak times, conversion funnels, and exportable reports.", icon: "📈", soon: true },
    ],
  },
};

const STEPS = [
  { n: "01", title: "Connect", desc: "Link your Instagram account in one click. We handle permissions, tokens, and webhooks automatically." },
  { n: "02", title: "Configure", desc: "Set your comment keywords, reel reply rules, and follower gate. Drag-and-drop simple." },
  { n: "03", title: "Automate", desc: "Go live. Every matching comment triggers a DM instantly. Track everything in real-time." },
  { n: "04", title: "Scale", desc: "Add more accounts, connect Shopify, enable AI replies. Grow without hiring." },
];

const COMPARISON = [
  { feature: "Comment-to-DM", engagr: true, manychat: true, others: true },
  { feature: "Follower gate", engagr: true, manychat: false, others: false },
  { feature: "Reel share detection", engagr: true, manychat: false, others: false },
  { feature: "AI product detection", engagr: "soon", manychat: false, others: false },
  { feature: "Shopify integration", engagr: "soon", manychat: "paid", others: false },
  { feature: "AI smart replies", engagr: "soon", manychat: false, others: false },
  { feature: "Knowledge base", engagr: "soon", manychat: false, others: false },
  { feature: "Multi-account", engagr: "Up to 5", manychat: "1", others: "Varies" },
  { feature: "Starting price", engagr: "\u20B9299/mo", manychat: "~\u20B91,250/mo", others: "Varies" },
];

const ACCOUNT_TYPES = [
  { key: "creator", label: "Creator", emoji: "\uD83C\uDFA8", subtitle: "For content creators and influencers" },
  { key: "business", label: "Business", emoji: "\uD83C\uDFEA", subtitle: "For e-commerce and service businesses" },
  { key: "agency", label: "Agency", emoji: "\uD83C\uDFE2", subtitle: "For social media agencies and managers" },
];

// Hardcoded fallback plans in case API is unavailable
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

const ROADMAP = [
  { label: "Now", color: "#34D399", active: true, items: ["Comment-to-DM automation", "Follower gate & reel detection", "Multi-account dashboard", "Early access — all features free"] },
  { label: "Q2 2026", color: "#2DD4BF", items: ["AI product detection from reels", "Smart link tracking & analytics", "Shopify catalog integration"] },
  { label: "Q3 2026", color: "#818CF8", items: ["AI smart replies with RAG", "Knowledge base system", "Conversation management"] },
  { label: "Q4 2026", color: "#71717A", items: ["Advanced analytics & reports", "API access & webhooks", "White-label options"] },
];

// ── Main component ──────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [pricingType, setPricingType] = useState("business");
  const [allPlans, setAllPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch plans for all account types on mount
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

  const featuresRef = useReveal();
  const stepsRef = useReveal();
  const aiRef = useReveal();
  const statsRef = useReveal();
  const compRef = useReveal();
  const pricingRef = useReveal();
  const roadmapRef = useReveal();
  const ctaRef = useReveal();

  return (
    <div className="min-h-screen" style={{ background: "#09090B", color: "#FAFAFA", fontFamily: "var(--font-inter), Inter, sans-serif" }}>

      {/* ═══ NAVBAR ═══════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(9, 9, 11, 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-inter)" }}>
            Engagr<span style={{ color: "#818CF8" }}>.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it Works", "Pricing", "Roadmap"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium transition-colors" style={{ color: "#A1A1AA" }}
                onMouseEnter={(e) => { e.target.style.color = "#FAFAFA"; }}
                onMouseLeave={(e) => { e.target.style.color = "#A1A1AA"; }}>
                {item}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium" style={{ color: "#A1A1AA" }}>Sign in</Link>
            <Link href="/onboarding" className="text-sm font-semibold px-5 py-2 rounded-full transition-colors"
              style={{ background: "#818CF8", color: "#fff" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#6366F1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#818CF8"; }}>
              Get started
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round">
              {mobileMenu ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden px-6 pb-6 space-y-4" style={{ background: "rgba(9, 9, 11, 0.95)", backdropFilter: "blur(12px)" }}>
            {["Features", "How it Works", "Pricing", "Roadmap"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="block text-sm font-medium py-2"
                style={{ color: "#A1A1AA" }} onClick={() => setMobileMenu(false)}>
                {item}
              </a>
            ))}
            <Link href="/onboarding" className="block text-center text-sm font-semibold px-5 py-2.5 rounded-full"
              style={{ background: "#818CF8", color: "#fff" }}>
              Get started
            </Link>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(129, 140, 248, 0.07) 0%, transparent 70%)" }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8"
            style={{ border: "1px solid rgba(45, 212, 191, 0.3)", background: "rgba(45, 212, 191, 0.08)", color: "#2DD4BF" }}>
            <span className="animate-pulse">✨</span> Now in Early Access — all features free
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Turn every Instagram<br />
            interaction into{" "}
            <GradientText>revenue</GradientText>
          </h1>

          {/* Subheadline */}
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: "#A1A1AA" }}>
            Whether you&apos;re a creator growing your audience, a business driving sales, or an agency managing clients — automate your Instagram DMs with AI.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/onboarding" className="text-base font-semibold px-8 py-3 rounded-full transition-colors"
              style={{ background: "#818CF8", color: "#fff" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#6366F1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#818CF8"; }}>
              Get started free
            </Link>
            <a href="#how-it-works" className="text-base font-semibold px-8 py-3 rounded-full transition-colors"
              style={{ border: "1px solid #3F3F46", color: "#D4D4D8" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#52525B"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3F3F46"; }}>
              See how it works ↓
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 text-sm" style={{ color: "#71717A" }}>
            <span>100+ creators</span>
            <span style={{ color: "#3F3F46" }}>·</span>
            <span>50K+ DMs sent</span>
            <span style={{ color: "#3F3F46" }}>·</span>
            <span>4.9/5 rating</span>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-32 overflow-hidden" ref={featuresRef} style={revealStyle}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(129, 140, 248, 0.06) 0%, transparent 70%)" }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20" data-reveal style={revealStyle}>
            <SectionEyebrow>Features</SectionEyebrow>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <GradientText>Everything you need to automate Instagram</GradientText>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#A1A1AA" }}>
              From comment triggers to AI-powered customer support. One platform, every tool.
            </p>
          </div>

          {Object.entries(FEATURES).map(([key, category]) => (
            <div key={key} className="mb-16">
              <p className="text-xs tracking-[0.2em] uppercase font-semibold mb-6" style={{ color: "#71717A" }} data-reveal style2={revealStyle}>
                {category.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.items.map((f, i) => (
                  <GlassCard key={i}>
                    <div data-reveal style={revealStyle}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                          style={{ background: "rgba(129, 140, 248, 0.1)" }}>
                          {f.icon}
                        </div>
                        {f.soon && <ComingSoonBadge />}
                      </div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: "#FAFAFA" }}>{f.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>{f.desc}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-32" ref={stepsRef} style={revealStyle}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-20" data-reveal style={revealStyle}>
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <GradientText>Live in 5 minutes</GradientText>
            </h2>
            <p className="text-lg" style={{ color: "#A1A1AA" }}>
              Connect your Instagram, set your rules, and let automation handle the rest.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px" style={{ background: "#27272A" }} />

            {STEPS.map((step, i) => (
              <div key={i} className="relative pl-20 pb-16 last:pb-0" data-reveal style={revealStyle}>
                {/* Dot */}
                <div className="absolute left-6 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: "#818CF8", background: "#09090B" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "#818CF8" }} />
                </div>
                <p className="text-6xl font-extrabold mb-2" style={{ color: "#18181B", fontFamily: "var(--font-mono)" }}>{step.n}</p>
                <h3 className="text-xl font-bold mb-2" style={{ color: "#FAFAFA" }}>{step.title}</h3>
                <p className="text-base" style={{ color: "#A1A1AA" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI PIPELINE ══════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden" ref={aiRef} style={revealStyle}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(167, 139, 250, 0.06) 0%, transparent 70%)" }} />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16" data-reveal style={revealStyle}>
            <SectionEyebrow>Powered by AI</SectionEyebrow>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <GradientText alt>AI that understands your business</GradientText>
            </h2>
            <p className="text-lg" style={{ color: "#A1A1AA" }}>Upload your catalog. Add your FAQs. Let AI handle the rest.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { n: "1", title: "Connect your data", tags: ["Shopify products", "PDF documents", "Website URLs"] },
              { n: "2", title: "AI learns your business", tags: ["Product catalog", "Return policies", "Brand voice"] },
              { n: "3", title: "Customers get instant answers", tags: ["Product recs", "Order help", "24/7 support"] },
            ].map((s, i) => (
              <GlassCard key={i}>
                <div data-reveal style={revealStyle}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-4"
                    style={{ background: "#818CF8", color: "#fff" }}>{s.n}</div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "#FAFAFA" }}>{s.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(129, 140, 248, 0.1)", color: "#818CF8", border: "1px solid rgba(129, 140, 248, 0.2)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="text-center">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm"
              style={{ border: "1px solid rgba(45, 212, 191, 0.3)", background: "rgba(45, 212, 191, 0.08)", color: "#2DD4BF" }}>
              Coming Q2 2026
            </span>
          </div>
        </div>
      </section>

      {/* ═══ STATS STRIP ══════════════════════════════════════════════════════ */}
      <section className="py-20 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }} ref={statsRef} style2={revealStyle}>
        <div className="max-w-5xl mx-auto px-6" ref={statsRef} style={revealStyle}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "50K+", label: "DMs Sent" },
              { num: "100+", label: "Creators" },
              { num: "5", label: "Accounts" },
              { num: "24/7", label: "AI Support" },
            ].map((s, i) => (
              <div key={i} data-reveal style={revealStyle}>
                <p className="text-4xl sm:text-5xl font-bold mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                  <GradientText>{s.num}</GradientText>
                </p>
                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#71717A" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═════════════════════════════════════════════════ */}
      <section id="comparison" className="py-32" ref={compRef} style={revealStyle}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16" data-reveal style={revealStyle}>
            <SectionEyebrow>Why Engagr?</SectionEyebrow>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <GradientText>Built different</GradientText>
            </h2>
            <p className="text-lg" style={{ color: "#A1A1AA" }}>See how Engagr compares.</p>
          </div>

          <GlassCard className="overflow-hidden !p-0">
            <div className="overflow-x-auto" data-reveal style={revealStyle}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#27272A" }}>
                    <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-semibold" style={{ color: "#71717A" }}>Feature</th>
                    <th className="text-center px-6 py-4 text-xs uppercase tracking-wider font-semibold" style={{ color: "#818CF8" }}>Engagr</th>
                    <th className="text-center px-6 py-4 text-xs uppercase tracking-wider font-semibold" style={{ color: "#71717A" }}>ManyChat</th>
                    <th className="text-center px-6 py-4 text-xs uppercase tracking-wider font-semibold" style={{ color: "#71717A" }}>Others</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-6 py-3.5 font-medium" style={{ color: "#D4D4D8" }}>{row.feature}</td>
                      {["engagr", "manychat", "others"].map((col) => {
                        const val = row[col];
                        return (
                          <td key={col} className="px-6 py-3.5 text-center">
                            {val === true ? <CheckIcon /> :
                              val === false ? <span style={{ color: "#3F3F46" }}>—</span> :
                                val === "soon" ? <ComingSoonBadge /> :
                                  val === "paid" ? <span className="text-xs" style={{ color: "#71717A" }}>Paid</span> :
                                    <span className="text-xs font-medium" style={{ color: "#A1A1AA" }}>{val}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ═══ PRICING ══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-32" ref={pricingRef} style={revealStyle}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10" data-reveal style={revealStyle}>
            <SectionEyebrow>Pricing</SectionEyebrow>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <GradientText>Simple, transparent pricing</GradientText>
            </h2>
            <p className="text-lg" style={{ color: "#A1A1AA" }}>Choose your path</p>
          </div>

          {/* Account type tab switcher */}
          <div className="flex justify-center mb-4" data-reveal style={revealStyle}>
            <div className="inline-flex p-1 rounded-full" style={{ background: "#18181B", border: "1px solid #27272A" }}>
              {ACCOUNT_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setPricingType(type.key)}
                  className="px-5 sm:px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
                  style={pricingType === type.key
                    ? { background: "#818CF8", color: "#fff", boxShadow: "0 4px 12px rgba(129, 140, 248, 0.3)" }
                    : { color: "#71717A" }
                  }
                  onMouseEnter={(e) => { if (pricingType !== type.key) e.currentTarget.style.color = "#D4D4D8"; }}
                  onMouseLeave={(e) => { if (pricingType !== type.key) e.currentTarget.style.color = "#71717A"; }}
                >
                  <span className="mr-1.5">{type.emoji}</span>{type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active type subtitle */}
          <p className="text-center text-sm mb-12" style={{ color: "#71717A" }}>
            {ACCOUNT_TYPES.find((t) => t.key === pricingType)?.subtitle}
          </p>

          {/* Plan cards — keyed by pricingType to trigger re-render animation */}
          <div key={pricingType} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
            style={{ animation: "fadeSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
            {(allPlans[pricingType] || []).map((plan, i) => {
              const priceDisplay = typeof plan.priceDisplay === "string"
                ? plan.priceDisplay
                : `\u20B9${(plan.price || 0).toLocaleString("en-IN")}`;
              const features = (plan.featureList || []).map((f) => {
                const key = typeof f === "string" ? f : f;
                return { key, label: FEATURE_LABELS[key] || key, soon: COMING_SOON_SET.has(key) };
              });

              return (
                <GlassCard key={plan.slug || i} featured={plan.isPopular} className="flex flex-col">
                  <div>
                    {plan.isPopular && (
                      <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full mb-4"
                        style={{ background: "rgba(129, 140, 248, 0.15)", color: "#818CF8" }}>
                        Most popular
                      </span>
                    )}
                    <h3 className="text-xl font-bold mb-2" style={{ color: "#FAFAFA" }}>{plan.name}</h3>
                    <p className="mb-1">
                      <span className="text-4xl font-extrabold" style={{ color: "#FAFAFA" }}>{priceDisplay}</span>
                      <span className="text-sm ml-1" style={{ color: "#71717A" }}>/month</span>
                    </p>
                    <div className="flex items-center gap-4 mb-6 text-xs" style={{ color: "#71717A" }}>
                      <span>{plan.dmLimitDisplay || "10,000"} DMs</span>
                      <span style={{ color: "#3F3F46" }}>&middot;</span>
                      <span>{plan.maxAccounts || 1} account{(plan.maxAccounts || 1) > 1 ? "s" : ""}</span>
                      <span style={{ color: "#3F3F46" }}>&middot;</span>
                      <span className="capitalize">{plan.supportLevel || "email"} support</span>
                    </div>
                    <div className="space-y-3 mb-8 flex-1">
                      {features.map((f) => (
                        <div key={f.key} className="flex items-start gap-2.5">
                          <CheckIcon />
                          <span className="text-sm" style={{ color: "#A1A1AA" }}>
                            {f.label}
                            {f.soon && <span className="ml-1.5 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(45, 212, 191, 0.1)", color: "#2DD4BF" }}>soon</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link href={`/sign-up?type=${pricingType}&plan=${plan.slug || ""}`}
                      className="block text-center text-sm font-semibold py-3 rounded-full transition-colors"
                      style={plan.isPopular
                        ? { background: "#818CF8", color: "#fff" }
                        : { border: "1px solid #3F3F46", color: "#D4D4D8" }
                      }
                      onMouseEnter={(e) => {
                        if (plan.isPopular) e.currentTarget.style.background = "#6366F1";
                        else { e.currentTarget.style.borderColor = "#52525B"; e.currentTarget.style.color = "#FAFAFA"; }
                      }}
                      onMouseLeave={(e) => {
                        if (plan.isPopular) e.currentTarget.style.background = "#818CF8";
                        else { e.currentTarget.style.borderColor = "#3F3F46"; e.currentTarget.style.color = "#D4D4D8"; }
                      }}>
                      Get started
                    </Link>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <p className="text-center text-sm" style={{ color: "#71717A" }}>
            {"\u2728"} Currently in early access — all features free for all account types. No credit card needed.
          </p>
        </div>

        {/* Inline animation keyframe */}
        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* ═══ ROADMAP ══════════════════════════════════════════════════════════ */}
      <section id="roadmap" className="py-32" ref={roadmapRef} style={revealStyle}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16" data-reveal style={revealStyle}>
            <SectionEyebrow>Roadmap</SectionEyebrow>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <GradientText>What&apos;s next</GradientText>
            </h2>
            <p className="text-lg" style={{ color: "#A1A1AA" }}>We ship fast. Here&apos;s what we&apos;re building.</p>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: "#27272A" }} />

            {ROADMAP.map((phase, i) => (
              <div key={i} className="relative pl-12 pb-12 last:pb-0" data-reveal style={revealStyle}>
                <div className="absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: phase.active ? phase.color : "#09090B",
                    border: `2px solid ${phase.color}`,
                    boxShadow: phase.active ? `0 0 12px ${phase.color}40` : "none",
                  }}>
                  {phase.active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                {phase.active && (
                  <div className="absolute left-0 top-1 w-7 h-7 rounded-full animate-ping" style={{ background: `${phase.color}30` }} />
                )}
                <p className="text-sm font-semibold mb-3" style={{ color: phase.color }}>{phase.label}</p>
                <div className="space-y-2">
                  {phase.items.map((item, j) => (
                    <p key={j} className="text-sm" style={{ color: "#A1A1AA" }}>{item}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden" ref={ctaRef} style={revealStyle}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(129, 140, 248, 0.08) 0%, transparent 70%)" }} />
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10" data-reveal style={revealStyle}>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            <GradientText>Start automating today</GradientText>
          </h2>
          <p className="text-lg mb-10" style={{ color: "#A1A1AA" }}>
            Sign up now for early access. Be first to try AI features when they launch.
          </p>
          <Link href="/onboarding"
            className="inline-block text-base font-semibold px-10 py-4 rounded-full transition-colors"
            style={{ background: "#818CF8", color: "#fff" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#6366F1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#818CF8"; }}>
            Get started free
          </Link>
          <p className="mt-4 text-sm" style={{ color: "#71717A" }}>No credit card required</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t py-16" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <p className="text-lg font-extrabold mb-2">Engagr<span style={{ color: "#818CF8" }}>.</span></p>
              <p className="text-sm mb-4" style={{ color: "#71717A" }}>Instagram automation platform for creators and brands.</p>
            </div>
            {[
              { title: "Product", links: [{ text: "Features", href: "#features" }, { text: "Pricing", href: "#pricing" }, { text: "Roadmap", href: "#roadmap" }] },
              { title: "Resources", links: [{ text: "How it Works", href: "#how-it-works" }, { text: "Contact", href: "mailto:tarun@engagr.io" }] },
              { title: "Legal", links: [{ text: "Privacy Policy", href: "/privacy" }, { text: "Terms of Service", href: "/terms" }] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: "#71717A" }}>{col.title}</p>
                <div className="space-y-2.5">
                  {col.links.map((link) => (
                    <a key={link.text} href={link.href} className="block text-sm transition-colors"
                      style={{ color: "#71717A" }}
                      onMouseEnter={(e) => { e.target.style.color = "#D4D4D8"; }}
                      onMouseLeave={(e) => { e.target.style.color = "#71717A"; }}>
                      {link.text}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <p className="text-xs" style={{ color: "#52525B" }}>© 2026 Engagr. All rights reserved.</p>
            <p className="text-xs mt-2 sm:mt-0" style={{ color: "#52525B" }}>Built with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
