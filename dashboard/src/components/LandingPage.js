"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import {
  MessageSquare, Zap, Users2, BarChart3, Shield, Bell,
  ArrowRight, Check, Star, Play, Heart, ChevronRight,
  Instagram, ShieldCheck, UserCheck, Activity, MousePointer2,
  MessageCircle, AtSign, TrendingUp, Menu, X, Sun, Moon,
} from "lucide-react";

/* ─────────────────────────── DATA ─────────────────────────── */

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Comment-to-DM Automation",
    description: "Instantly detect comments on your posts or reels and auto-send a personalized DM. Turn casual engagement into real conversations.",
    iconColor: "var(--info)",
    iconBg: "var(--info-light)",
    iconBorder: "var(--info)",
  },
  {
    icon: UserCheck,
    title: "Follower Verification Gate",
    description: "Send a confirm-follow button to non-followers. Once they follow and tap confirm, your automation message is delivered automatically.",
    iconColor: "var(--success)",
    iconBg: "var(--success-light)",
    iconBorder: "var(--success)",
  },
  {
    icon: Zap,
    title: "Smart Reply Presets",
    description: "Choose from ready-made public reply and DM templates, or write your own. One-click setup for every tone and brand voice.",
    iconColor: "var(--warning)",
    iconBg: "var(--warning-light)",
    iconBorder: "var(--warning)",
  },
  {
    icon: Play,
    title: "Reel Share Detection",
    description: "When someone shares your reel in a DM, Engagr captures the share and auto-replies with a rich card linking back to the original content.",
    iconColor: "var(--primary)",
    iconBg: "var(--primary-light)",
    iconBorder: "var(--primary)",
  },
  {
    icon: AtSign,
    title: "Mentions Tracker",
    description: "Get notified and auto-respond every time someone mentions your brand in their stories, posts, or comments.",
    iconColor: "var(--error)",
    iconBg: "var(--error-light)",
    iconBorder: "var(--error)",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track transmission health, daily DMs sent, interaction breakdown by type, and growth trends. All on a live dashboard.",
    iconColor: "var(--accent)",
    iconBg: "var(--accent-light)",
    iconBorder: "var(--accent)",
  },
  {
    icon: Users2,
    title: "Contact Management",
    description: "See every unique user who has interacted with your account. Search, sort, and view each contact's interaction history and DM status.",
    iconColor: "var(--primary-dark)",
    iconBg: "var(--primary-light)",
    iconBorder: "var(--primary-dark)",
  },
  {
    icon: Activity,
    title: "Activity Feed & Logs",
    description: "A full filterable log of all interactions: comments, DMs, reel shares, mentions, reactions, and button taps. Up to 100 recent events.",
    iconColor: "var(--error)",
    iconBg: "var(--error-light)",
    iconBorder: "var(--error)",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Connect Your Instagram",
    description: "Sign up, log in with Instagram Business Login, and authorize Engagr in under 60 seconds. No Facebook Page needed.",
  },
  {
    step: "02",
    title: "Configure Your Automation",
    description: "Pick a post or reel, set keyword triggers or any-comment mode, choose your public reply, craft the DM message, and optionally enable the follower gate.",
  },
  {
    step: "03",
    title: "Go Live & Watch It Work",
    description: "Hit 'Save & Activate' and your automation starts instantly. Every qualifying comment triggers a public reply and private DM in real time.",
  },
];

const CASE_STUDIES = [
  {
    brand: "LuxeThread Boutique",
    industry: "Fashion & Apparel",
    logo: "LT",
    gradientFrom: "var(--primary)",
    gradientTo: "var(--primary-dark)",
    problem: "Getting 500+ comments on product launch reels but manually sending only 20 DMs per day. Most interested buyers never heard back.",
    solution: "Set up comment-to-DM automation on every new launch reel. Keyword trigger on 'price', 'link', and 'details' with an instant DM containing the product link.",
    results: [
      { metric: "3.2x", label: "More DM conversations" },
      { metric: "40%", label: "Increase in DM-driven sales" },
      { metric: "12 hrs", label: "Saved per week" },
    ],
    quote: "We went from missing hundreds of leads to replying to every single one within seconds. The ROI was immediate.",
  },
  {
    brand: "FitLife by Coach Arjun",
    industry: "Fitness & Coaching",
    logo: "FL",
    gradientFrom: "var(--success)",
    gradientTo: "var(--accent)",
    problem: "Spending 3+ hours every day replying to 'how to join' and 'price' comments on coaching reels. Could not scale beyond 50 clients.",
    solution: "Enabled keyword-triggered automation with follower verification gate. Non-followers get a follow prompt, confirmed followers receive the program link instantly.",
    results: [
      { metric: "15 hrs", label: "Saved per week" },
      { metric: "2x", label: "More program sign-ups" },
      { metric: "95%", label: "Follower conversion rate" },
    ],
    quote: "The follower gate is genius. People actually follow now because they want the DM. My follower count grew 30% in a month.",
  },
  {
    brand: "SnackBox India",
    industry: "E-commerce & D2C",
    logo: "SB",
    gradientFrom: "var(--warning)",
    gradientTo: "var(--accent)",
    problem: "A product reel went viral with 2,000+ comments overnight. The team could not keep up, and potential customers moved on.",
    solution: "Activated any-comment automation with a DM containing the shop link and a 10% discount code. Public reply thanked commenters and told them to check DMs.",
    results: [
      { metric: "47%", label: "Increase in website traffic" },
      { metric: "2.8L", label: "Additional revenue (first month)" },
      { metric: "0", label: "Missed leads" },
    ],
    quote: "Our reel hit 2,000 comments and Engagr handled every single one. We made more revenue that week than the entire previous month.",
  },
];

const STATS = [
  { value: "50K+", label: "DMs Delivered" },
  { value: "2,500+", label: "Automations Created" },
  { value: "98.7%", label: "Delivery Success Rate" },
  { value: "< 3s", label: "Average Reply Time" },
];

/* ─────────────────────────── COMPONENTS ─────────────────────────── */

function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--glass-bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center premium-gradient"
            style={{ boxShadow: '0 2px 8px var(--primary-glow)' }}
          >
            <ShieldCheck className="text-white" size={17} />
          </div>
          <span className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Engagr</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>Features</a>
          <a href="#how-it-works" className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>How It Works</a>
          <a href="#case-studies" className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>Case Studies</a>
          <Link href="/pricing" className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>Pricing</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
            }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link
            href="/sign-in"
            className="px-5 py-2 text-sm font-bold transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all premium-gradient"
            style={{
              color: 'var(--btn-primary-text)',
              boxShadow: '0 4px 14px var(--primary-glow)',
            }}
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
            }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setOpen(!open)} className="p-2" style={{ color: 'var(--text-secondary)' }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-6 py-6 space-y-4"
          style={{
            backgroundColor: 'var(--card)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <a href="#features" onClick={() => setOpen(false)} className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)} className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>How It Works</a>
          <a href="#case-studies" onClick={() => setOpen(false)} className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Case Studies</a>
          <Link href="/pricing" className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Pricing</Link>
          <div className="pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <Link
              href="/sign-in"
              className="text-center py-3 text-sm font-bold rounded-xl"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-center py-3 text-sm font-bold rounded-xl premium-gradient"
              style={{ color: 'var(--btn-primary-text)' }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center premium-gradient">
                <ShieldCheck className="text-white" size={17} />
              </div>
              <span className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Engagr</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Next-generation Instagram automation for businesses that want to turn every comment into a conversion.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-placeholder)' }}>Product</h4>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li><a href="#features" className="hover:opacity-80 transition-colors">Features</a></li>
              <li><Link href="/pricing" className="hover:opacity-80 transition-colors">Pricing</Link></li>
              <li><a href="#case-studies" className="hover:opacity-80 transition-colors">Case Studies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-placeholder)' }}>Account</h4>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li><Link href="/sign-in" className="hover:opacity-80 transition-colors">Sign In</Link></li>
              <li><Link href="/sign-up" className="hover:opacity-80 transition-colors">Create Account</Link></li>
              <li><Link href="/dashboard" className="hover:opacity-80 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-placeholder)' }}>Legal</h4>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
              <li><Link href="/data-deletion-status" className="hover:opacity-80 transition-colors">Data Deletion</Link></li>
            </ul>
          </div>
        </div>
        <div
          className="mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-placeholder)' }}>&copy; {new Date().getFullYear()} Engagr. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
              }}
            >
              <Instagram size={13} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Built on Meta Instagram API</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────── PAGE ─────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen theme-transition" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl -z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-5xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--primary-medium)',
            }}
          >
            <Zap size={13} style={{ color: 'var(--primary)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Instagram Automation Platform</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6" style={{ color: 'var(--text-primary)' }}>
            Turn Every Comment<br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(to right, var(--primary), var(--primary-dark))',
              }}
            >
              Into a Conversation
            </span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-medium" style={{ color: 'var(--text-muted)' }}>
            Engagr automatically replies to Instagram comments and sends personalized DMs in under 3 seconds.
            Capture every lead, grow your followers, and close more sales — hands-free.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-4 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 premium-gradient"
              style={{
                color: 'var(--btn-primary-text)',
                boxShadow: '0 8px 24px var(--primary-glow)',
              }}
            >
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              View Pricing
            </Link>
          </div>

          {/* Dashboard mockup */}
          <div className="relative max-w-4xl mx-auto">
            <div
              className="rounded-[24px] p-2 sm:p-3"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: '0 25px 50px -12px var(--primary-glow)',
              }}
            >
              <div className="rounded-[18px] p-6 sm:p-10 space-y-6" style={{ backgroundColor: 'var(--surface-alt)' }}>
                {/* Mockup top bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(to top right, var(--accent), var(--primary), var(--primary-dark))',
                      }}
                    >
                      <Instagram size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>@yourbrand</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>Automation Live</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="px-4 py-2 rounded-xl text-center"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>247</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>DMs Today</p>
                    </div>
                    <div
                      className="px-4 py-2 rounded-xl text-center"
                      style={{
                        backgroundColor: 'var(--success-light)',
                        border: '1px solid var(--success)',
                      }}
                    >
                      <p className="text-xl font-black" style={{ color: 'var(--success)' }}>+32%</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>Growth</p>
                    </div>
                  </div>
                </div>

                {/* Mockup feed */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { type: "Comment", user: "@priya_styles", text: "OMG how much is this?", status: "Replied", statusColor: "var(--success)", statusBg: "var(--success-light)" },
                    { type: "Reel Share", user: "@rahul.fit", text: "Shared your reel", status: "DM Sent", statusColor: "var(--info)", statusBg: "var(--info-light)" },
                    { type: "Mention", user: "@foodie_delhi", text: "Tagged you in story", status: "Replied", statusColor: "var(--success)", statusBg: "var(--success-light)" },
                  ].map((item) => (
                    <div
                      key={item.user}
                      className="rounded-2xl p-4 space-y-2"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>{item.type}</span>
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{
                            color: item.statusColor,
                            backgroundColor: item.statusBg,
                            border: `1px solid ${item.statusColor}`,
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.user}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-placeholder)' }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Glow behind mockup */}
            <div
              className="absolute inset-0 rounded-[24px] blur-2xl -z-10 scale-105"
              style={{
                background: 'linear-gradient(to top, var(--primary-glow), transparent)',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <section
        className="py-12 px-6"
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-alt)',
        }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--primary)' }}>Everything You Need</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
              Powerful Features,<br />Zero Complexity
            </h2>
            <p className="max-w-xl mx-auto text-base font-medium" style={{ color: 'var(--text-muted)' }}>
              From comment detection to follower verification — every tool you need to automate your Instagram engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-[24px] p-7 hover:-translate-y-1 transition-all duration-300 group"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: f.iconBg,
                      border: `1px solid ${f.iconBorder}`,
                    }}
                  >
                    <Icon size={20} style={{ color: f.iconColor }} />
                  </div>
                  <h3 className="text-[15px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 px-6"
        style={{
          backgroundColor: 'var(--surface-alt)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--primary)' }}>Simple Setup</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
              Live in 3 Minutes
            </h2>
            <p className="max-w-lg mx-auto text-base font-medium" style={{ color: 'var(--text-muted)' }}>
              No coding, no APIs to configure, no Facebook Page required. Just connect and go.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-12 left-full w-full h-px -z-10"
                    style={{ borderTop: '2px dashed var(--border)' }}
                  />
                )}
                <div
                  className="rounded-[28px] p-8 h-full"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      backgroundColor: 'var(--primary-light)',
                    }}
                  >
                    <span className="text-lg font-black" style={{ color: 'var(--primary)' }}>{s.step}</span>
                  </div>
                  <h3 className="text-lg font-black mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASE STUDIES ────────────────────────────────────────── */}
      <section id="case-studies" className="py-24 px-6" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--primary)' }}>Real Results</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
              Case Studies
            </h2>
            <p className="max-w-lg mx-auto text-base font-medium" style={{ color: 'var(--text-muted)' }}>
              See how businesses across industries are using Engagr to grow their Instagram engagement and revenue.
            </p>
          </div>

          <div className="space-y-10">
            {CASE_STUDIES.map((cs, idx) => (
              <div
                key={cs.brand}
                className="rounded-[32px] overflow-hidden transition-shadow duration-300"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
                  {/* Left — brand + problem */}
                  <div className="p-8 sm:p-10" style={{ borderRight: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black"
                        style={{
                          background: `linear-gradient(to bottom right, ${cs.gradientFrom}, ${cs.gradientTo})`,
                        }}
                      >
                        {cs.logo}
                      </div>
                      <div>
                        <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{cs.brand}</h3>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>{cs.industry}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--error)' }}>The Problem</p>
                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{cs.problem}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--success)' }}>The Solution</p>
                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{cs.solution}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right — results + quote */}
                  <div className="p-8 sm:p-10 flex flex-col justify-between" style={{ backgroundColor: 'var(--surface-alt)' }}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-5" style={{ color: 'var(--primary)' }}>Results</p>
                      <div className="grid grid-cols-3 gap-4 mb-8">
                        {cs.results.map((r) => (
                          <div
                            key={r.label}
                            className="rounded-2xl p-4 text-center"
                            style={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <p className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{r.metric}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest leading-tight" style={{ color: 'var(--text-placeholder)' }}>{r.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className="flex items-start gap-3 rounded-2xl p-5"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: 'linear-gradient(to bottom right, var(--warning), var(--accent))',
                        }}
                      >
                        <Star size={14} className="text-white fill-white" />
                      </div>
                      <p className="text-[13px] italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>"{cs.quote}"</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOLLOWER GATE HIGHLIGHT ─────────────────────────────── */}
      <section
        className="py-24 px-6 overflow-hidden relative"
        style={{
          background: 'linear-gradient(to bottom right, var(--primary-darker), var(--primary-dark))',
          color: 'white',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 50%, var(--primary-glow), transparent 60%)',
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <UserCheck size={13} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Exclusive Feature</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5 leading-[1.1] text-white">
                Follower<br />Verification Gate
              </h2>
              <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Non-followers who comment receive a DM with a <strong className="text-white">"I'm following now"</strong> button. Engagr verifies their follow status in real time. Only confirmed followers get your automation message. Grow your followers while capturing leads.
              </p>
              <div className="space-y-3">
                {[
                  "Non-follower comments on your post",
                  "Bot sends a DM with follow prompt + confirm button",
                  "User follows your account and taps confirm",
                  "Engagr verifies the follow and delivers your DM",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <span className="text-xs font-black text-white">{i + 1}</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div
                className="w-72 rounded-[36px] p-4 shadow-2xl"
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="rounded-[24px] overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
                  <div
                    className="p-4 flex items-center gap-3 premium-gradient"
                  >
                    <Instagram size={18} className="text-white" />
                    <span className="text-white text-sm font-bold">Instagram DM</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div
                      className="rounded-2xl rounded-tl-sm p-3 max-w-[200px]"
                      style={{ backgroundColor: 'var(--surface-alt)' }}
                    >
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Hey! Follow @yourbrand to receive my message
                      </p>
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-sm p-3 max-w-[220px] space-y-2"
                      style={{ backgroundColor: 'var(--surface-alt)' }}
                    >
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Once you've followed, tap below to confirm!</p>
                      <div
                        className="text-xs font-bold text-center py-2 px-4 rounded-xl premium-gradient"
                        style={{ color: 'var(--btn-primary-text)' }}
                      >
                        I'm following now!
                      </div>
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-sm p-3 max-w-[230px] mt-1"
                      style={{
                        backgroundColor: 'var(--success-light)',
                        border: '1px solid var(--success)',
                      }}
                    >
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--success)' }}>
                        Thanks for following! Here's your exclusive link
                      </p>
                      <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--primary)' }}>yourlink.com/offer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>
            Ready to Automate Your<br />Instagram Growth?
          </h2>
          <p className="text-base font-medium mb-10 max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
            Join thousands of businesses that use Engagr to capture leads, grow followers, and close more sales from Instagram — on autopilot.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-10 py-4 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 premium-gradient"
              style={{
                color: 'var(--btn-primary-text)',
                boxShadow: '0 8px 24px var(--primary-glow)',
              }}
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-10 py-4 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Compare Plans <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
