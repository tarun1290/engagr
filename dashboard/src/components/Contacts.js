"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Users2, MessageSquare, MessageCircle, AtSign, Play, Heart, MousePointer2, Send, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContacts } from '@/app/dashboard/actions';

const TYPE_CONFIG = {
  comment:    { label: "Comment",    icon: MessageCircle, color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100"   },
  mention:    { label: "Mention",    icon: AtSign,        color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
  dm:         { label: "DM",         icon: MessageSquare, color: "text-pink-500",   bg: "bg-pink-50",   border: "border-pink-100"   },
  reel_share: { label: "Reel",       icon: Play,          color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100"  },
  reaction:   { label: "Reaction",   icon: Heart,         color: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-100"   },
  postback:   { label: "Button",     icon: MousePointer2, color: "text-cyan-500",   bg: "bg-cyan-50",   border: "border-cyan-100"   },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ContactRow({ contact }) {
  const displayName = contact.username ? `@${contact.username}` : contact.name || contact._id;
  const subName = contact.username && contact.name ? contact.name : null;

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-pink-300/20 flex items-center justify-center flex-shrink-0 border border-slate-100">
        <span className="text-[13px] font-black text-primary">
          {(contact.username || contact.name || "?")[0].toUpperCase()}
        </span>
      </div>

      {/* Name */}
      <div className="w-44 flex-shrink-0 min-w-0">
        <p className="text-[13px] font-bold text-slate-900 truncate">{displayName}</p>
        {subName && <p className="text-[11px] text-slate-400 truncate">{subName}</p>}
      </div>

      {/* Interaction type badges */}
      <div className="flex-1 flex items-center gap-1.5 flex-wrap">
        {(contact.types || []).map((type) => {
          const conf = TYPE_CONFIG[type];
          if (!conf) return null;
          const Icon = conf.icon;
          return (
            <div key={type} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest", conf.bg, conf.border, conf.color)}>
              <Icon size={9} />
              {conf.label}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-8 flex-shrink-0 text-right">
        <div className="w-20">
          <p className="text-[14px] font-black text-slate-900">{contact.totalInteractions}</p>
          <p className="text-[10px] text-slate-400 font-medium">interactions</p>
        </div>
        <div className="w-16">
          <p className={cn("text-[14px] font-black", contact.dmsSent > 0 ? "text-emerald-600" : "text-slate-300")}>
            {contact.dmsSent}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">DMs sent</p>
        </div>
        <div className="w-20 text-right">
          <p className="text-[12px] font-semibold text-slate-500">{timeAgo(contact.lastSeen)}</p>
          <p className="text-[10px] text-slate-400 font-medium">last seen</p>
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
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-100">
        <div>
          <h2 className="text-5xl font-black text-black tracking-tight leading-none">Contacts</h2>
          <p className="text-slate-400 text-[14px] font-medium mt-2">
            {contacts.length} unique users who have interacted with your account.
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Total Contacts</p>
            <p className="text-2xl font-black text-slate-900">{contacts.length}</p>
          </div>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest">DMs Sent</p>
            <p className="text-2xl font-black text-emerald-700">
              {contacts.reduce((s, c) => s + c.dmsSent, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or name…"
            className="w-full pl-9 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1">
          {[['lastSeen', 'Recent'], ['interactions', 'Interactions'], ['dms', 'DMs']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all",
                sortBy === key ? "bg-white shadow-sm text-slate-900 border border-slate-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <ArrowUpDown size={13} />
          <span className="text-[11px] font-bold">{filtered.length} shown</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center gap-4">
          <div className="w-10 flex-shrink-0" />
          <div className="w-44 flex-shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User</span>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interaction Types</span>
          </div>
          <div className="flex items-center gap-8 flex-shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Events</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">DMs</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-right">Last Seen</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Users2 size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">
              {search ? 'No contacts match your search.' : 'No contacts yet.'}
            </p>
            <p className="text-slate-300 text-xs mt-1">Contacts appear once someone interacts with your account.</p>
          </div>
        ) : (
          filtered.map((contact) => <ContactRow key={contact._id} contact={contact} />)
        )}
      </div>
    </div>
  );
}
