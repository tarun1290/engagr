"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Users2, MessageSquare, MessageCircle, AtSign, Play, Heart, MousePointer2, Send, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContacts } from '@/app/dashboard/actions';

const TYPE_CONFIG = {
  comment:    { label: "Comment",    icon: MessageCircle, color: 'var(--info)',    bg: 'var(--info-light)',    border: 'var(--border)' },
  mention:    { label: "Mention",    icon: AtSign,        color: 'var(--primary)', bg: 'var(--primary-light)', border: 'var(--border)' },
  dm:         { label: "DM",         icon: MessageSquare, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'var(--border)' },
  reel_share: { label: "Reel",       icon: Play,          color: 'var(--warning)', bg: 'var(--warning-light)', border: 'var(--border)' },
  reaction:   { label: "Reaction",   icon: Heart,         color: 'var(--error)',   bg: 'var(--error-light)',   border: 'var(--border)' },
  postback:   { label: "Button",     icon: MousePointer2, color: 'var(--accent)',  bg: 'var(--accent-light)',  border: 'var(--border)' },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
      <div className="w-44 flex-shrink-0 space-y-2">
        <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
        <div className="h-2 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
      </div>
      <div className="flex-1 flex items-center gap-1.5">
        <div className="h-5 w-16 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
        <div className="h-5 w-14 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
      </div>
      <div className="flex items-center gap-8 flex-shrink-0">
        <div className="w-20 space-y-1">
          <div className="h-4 w-8 rounded animate-pulse ml-auto" style={{ backgroundColor: 'var(--surface-alt)' }} />
          <div className="h-2 w-16 rounded animate-pulse ml-auto" style={{ backgroundColor: 'var(--surface-alt)' }} />
        </div>
        <div className="w-16 space-y-1">
          <div className="h-4 w-6 rounded animate-pulse ml-auto" style={{ backgroundColor: 'var(--surface-alt)' }} />
          <div className="h-2 w-12 rounded animate-pulse ml-auto" style={{ backgroundColor: 'var(--surface-alt)' }} />
        </div>
        <div className="w-20 space-y-1">
          <div className="h-3 w-14 rounded animate-pulse ml-auto" style={{ backgroundColor: 'var(--surface-alt)' }} />
          <div className="h-2 w-12 rounded animate-pulse ml-auto" style={{ backgroundColor: 'var(--surface-alt)' }} />
        </div>
      </div>
    </div>
  );
}

function ContactRow({ contact }) {
  const displayName = contact.username ? `@${contact.username}` : contact.name || contact._id;
  const subName = contact.username && contact.name ? contact.name : null;

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 last:border-0 transition-colors theme-transition"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-alt)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(to bottom right, var(--primary-light), var(--primary-light))', border: '1px solid var(--border)' }}
      >
        <span className="text-[13px] font-black" style={{ color: 'var(--primary)' }}>
          {(contact.username || contact.name || "?")[0].toUpperCase()}
        </span>
      </div>

      {/* Name */}
      <div className="w-44 flex-shrink-0 min-w-0">
        <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
        {subName && <p className="text-[11px] truncate" style={{ color: 'var(--text-placeholder)' }}>{subName}</p>}
      </div>

      {/* Interaction type badges */}
      <div className="flex-1 flex items-center gap-1.5 flex-wrap">
        {(contact.types || []).map((type) => {
          const conf = TYPE_CONFIG[type];
          if (!conf) return null;
          const Icon = conf.icon;
          return (
            <div
              key={type}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
              style={{ color: conf.color, backgroundColor: conf.bg, border: `1px solid ${conf.border}` }}
            >
              <Icon size={9} />
              {conf.label}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-8 flex-shrink-0 text-right">
        <div className="w-20">
          <p className="text-[14px] font-black" style={{ color: 'var(--text-primary)' }}>{contact.totalInteractions}</p>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-placeholder)' }}>interactions</p>
        </div>
        <div className="w-16">
          <p className="text-[14px] font-black" style={{ color: contact.dmsSent > 0 ? 'var(--success)' : 'var(--text-placeholder)' }}>
            {contact.dmsSent}
          </p>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-placeholder)' }}>DMs sent</p>
        </div>
        <div className="w-20 text-right">
          <p className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>{timeAgo(contact.lastSeen)}</p>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-placeholder)' }}>last seen</p>
        </div>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastSeen');

  useEffect(() => {
    getContacts()
      .then(setContacts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.username || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || c._id.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'interactions') return b.totalInteractions - a.totalInteractions;
      if (sortBy === 'dms') return b.dmsSent - a.dmsSent;
      return new Date(b.lastSeen) - new Date(a.lastSeen);
    });

  if (loading) {
    return (
      <div className="space-y-8 theme-transition">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="h-12 w-64 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
            <div className="h-4 w-80 rounded mt-2 animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-16 w-36 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
            <div className="h-16 w-36 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
          </div>
        </div>
        {/* Filter skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
          <div className="h-10 w-56 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
        </div>
        {/* Table skeleton */}
        <div className="rounded-[28px] overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-alt)' }}>
            <div className="h-3 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
          </div>
          {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 theme-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="text-5xl font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>Contacts</h2>
          <p className="text-[14px] font-medium mt-2" style={{ color: 'var(--text-placeholder)' }}>
            {contacts.length} unique users who have interacted with your account.
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-2xl" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Total Contacts</p>
            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{contacts.length}</p>
          </div>
          <div className="px-4 py-2 rounded-2xl" style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>DMs Sent</p>
            <p className="text-2xl font-black" style={{ color: 'var(--success-dark)' }}>
              {contacts.reduce((s, c) => s + c.dmsSent, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-placeholder)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or name…"
            className="w-full pl-9 pr-4 h-10 rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--input-text)',
            }}
            onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--input-focus-ring)'}
            onBlur={e => e.target.style.boxShadow = 'none'}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
          {[['lastSeen', 'Recent'], ['interactions', 'Interactions'], ['dms', 'DMs']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all"
              style={sortBy === key
                ? { backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                : { color: 'var(--text-placeholder)', border: '1px solid transparent' }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-placeholder)' }}>
          <ArrowUpDown size={13} />
          <span className="text-[11px] font-bold">{filtered.length} shown</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[28px] overflow-hidden shadow-sm theme-transition" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="px-6 py-3 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-alt)' }}>
          <div className="w-10 flex-shrink-0" />
          <div className="w-44 flex-shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>User</span>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Interaction Types</span>
          </div>
          <div className="flex items-center gap-8 flex-shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest w-20" style={{ color: 'var(--text-placeholder)' }}>Events</span>
            <span className="text-[10px] font-black uppercase tracking-widest w-16" style={{ color: 'var(--text-placeholder)' }}>DMs</span>
            <span className="text-[10px] font-black uppercase tracking-widest w-20 text-right" style={{ color: 'var(--text-placeholder)' }}>Last Seen</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Users2 size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-placeholder)' }}>
              {search ? 'No contacts match your search.' : 'No contacts yet.'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Contacts appear once someone interacts with your account.</p>
          </div>
        ) : (
          filtered.map((contact) => <ContactRow key={contact._id} contact={contact} />)
        )}
      </div>
    </div>
  );
}
