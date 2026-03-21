"use client";

import React, { useState, useEffect } from 'react';
import {
  Loader2, MessageSquare, MessageCircle, AtSign, Play, Heart,
  MousePointer2, Send, CheckCircle2, XCircle, RefreshCw, SkipForward,
  Activity as ActivityIcon, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllInteractions } from '@/app/dashboard/actions';

const TYPE_CONFIG = {
  comment:    { label: "Comment",    icon: MessageCircle, color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100"   },
  mention:    { label: "Mention",    icon: AtSign,        color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
  dm:         { label: "DM",         icon: MessageSquare, color: "text-pink-500",   bg: "bg-pink-50",   border: "border-pink-100"   },
  reel_share: { label: "Reel Share", icon: Play,          color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100"  },
  reaction:   { label: "Reaction",   icon: Heart,         color: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-100"   },
  postback:   { label: "Button Tap", icon: MousePointer2, color: "text-cyan-500",   bg: "bg-cyan-50",   border: "border-cyan-100"   },
};

const REPLY_STATUS_CONFIG = {
  sent:          { label: "Replied",  icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  failed:        { label: "Failed",   icon: XCircle,      color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100"    },
  fallback:      { label: "Fallback", icon: RefreshCw,    color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
  skipped:       { label: "Skipped",  icon: SkipForward,  color: "text-slate-400",   bg: "bg-slate-50",   border: "border-slate-200"   },
  token_expired: { label: "Expired",  icon: XCircle,      color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100"  },
};

const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'comment',    label: 'Comments' },
  { key: 'dm',         label: 'DMs' },
  { key: 'mention',    label: 'Mentions' },
  { key: 'reel_share', label: 'Reel Shares' },
  { key: 'reaction',   label: 'Reactions' },
  { key: 'postback',   label: 'Button Taps' },
];

const ATTACHMENT_LABELS = {
  reel: "Reel", post_share: "Post", image: "Image",
  video: "Video", audio: "Voice", media: "Media",
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EventRow({ event }) {
  const typeConf = TYPE_CONFIG[event.type] || TYPE_CONFIG.comment;
  const statusConf = REPLY_STATUS_CONFIG[event.reply?.status] || REPLY_STATUS_CONFIG.skipped;
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  const thumbnail = event.content?.thumbnailUrl || event.content?.mediaUrl;
  const mediaLink = event.content?.permalink || event.content?.mediaUrl;
  const attachmentLabel = ATTACHMENT_LABELS[event.content?.attachmentType];
  const displayText = event.content?.text
    || (attachmentLabel ? `Sent a ${attachmentLabel.toLowerCase()}` : null)
    || event.reply?.publicReply
    || '—';

  const dateStr = new Date(event.createdAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="flex items-start gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      {/* Type icon */}
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5", typeConf.bg, typeConf.border)}>
        <TypeIcon size={15} className={typeConf.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={cn("text-[10px] font-black uppercase tracking-widest", typeConf.color)}>{typeConf.label}</span>
          {event.from?.username ? (
            <span className="text-[12px] font-bold text-slate-700">@{event.from.username}</span>
          ) : event.from?.name ? (
            <span className="text-[12px] font-semibold text-slate-600">{event.from.name}</span>
          ) : event.from?.id ? (
            <span className="text-[11px] font-mono text-slate-400">{event.from.id}</span>
          ) : null}
          {attachmentLabel && (
            <span className="text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
              {attachmentLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {thumbnail && (
            mediaLink ? (
              <a href={mediaLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img src={thumbnail} alt="media" className="w-10 h-10 rounded-lg object-cover border border-slate-200 hover:border-primary transition-colors" />
              </a>
            ) : (
              <img src={thumbnail} alt="media" className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
            )
          )}
          <p className="text-[13px] text-slate-500 truncate leading-tight">{displayText}</p>
        </div>
        {event.reply?.publicReply && event.content?.text && (
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            <span className="font-bold">Public reply:</span> {event.reply.publicReply}
          </p>
        )}
        {event.reply?.dmText && (
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            <span className="font-bold">DM sent:</span> {event.reply.dmText}
          </p>
        )}
      </div>

      {/* Reply status */}
      <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border flex-shrink-0 mt-0.5", statusConf.bg, statusConf.border)}>
        <StatusIcon size={11} className={statusConf.color} />
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", statusConf.color)}>{statusConf.label}</span>
      </div>

      {/* Time */}
      <div className="text-right flex-shrink-0 mt-0.5">
        <p className="text-[11px] text-slate-400">{timeAgo(event.createdAt)}</p>
        <p className="text-[10px] text-slate-300">{dateStr}</p>
      </div>
    </div>
  );
}

export default function Activity() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllInteractions(activeFilter === 'all' ? null : activeFilter)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeFilter]);

  const counts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-8 border-b border-slate-100">
        <h2 className="text-5xl font-black text-black tracking-tight leading-none">Activity</h2>
        <p className="text-slate-400 text-[14px] font-medium mt-2">
          Full interaction log — up to 100 most recent events.
        </p>
      </div>

      {/* Breakdown pills */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_CONFIG).map(([type, conf]) => {
          const count = events.filter(e => e.type === type).length;
          if (count === 0 && activeFilter !== type) return null;
          const Icon = conf.icon;
          return (
            <div key={type} className={cn("flex items-center gap-2 px-4 py-2 rounded-2xl border", conf.bg, conf.border)}>
              <Icon size={14} className={conf.color} />
              <span className="text-lg font-black text-slate-900">{count}</span>
              <span className={cn("text-[10px] font-bold uppercase tracking-widest", conf.color)}>{conf.label}</span>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 flex-wrap">
        <Filter size={13} className="text-slate-400 ml-2 mr-1" />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-[12px] font-bold transition-all",
              activeFilter === f.key
                ? "bg-white shadow-sm text-slate-900 border border-slate-100"
                : "text-slate-400 hover:text-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto mr-2 text-[11px] font-bold text-slate-400">{events.length} events</span>
      </div>

      {/* Events list */}
      <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-16">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Type</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User · Content</span>
          </div>
          <div className="flex items-center gap-8 pr-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reply</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">When</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center">
            <ActivityIcon size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No activity yet.</p>
            <p className="text-slate-300 text-xs mt-1">Events appear here once your automation starts receiving interactions.</p>
          </div>
        ) : (
          events.map((event) => <EventRow key={event._id} event={event} />)
        )}
      </div>
    </div>
  );
}
