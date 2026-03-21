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
  comment:    { label: "Comment",    icon: MessageCircle, color: 'var(--info)',    bg: 'var(--info-light)',    border: 'var(--border)' },
  mention:    { label: "Mention",    icon: AtSign,        color: 'var(--primary)', bg: 'var(--primary-light)', border: 'var(--border)' },
  dm:         { label: "DM",         icon: MessageSquare, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'var(--border)' },
  reel_share: { label: "Reel Share", icon: Play,          color: 'var(--warning)', bg: 'var(--warning-light)', border: 'var(--border)' },
  reaction:   { label: "Reaction",   icon: Heart,         color: 'var(--error)',   bg: 'var(--error-light)',   border: 'var(--border)' },
  postback:   { label: "Button Tap", icon: MousePointer2, color: 'var(--accent)',  bg: 'var(--accent-light)',  border: 'var(--border)' },
};

const REPLY_STATUS_CONFIG = {
  sent:          { label: "Replied",  icon: CheckCircle2, color: 'var(--success)',      bg: 'var(--success-light)', border: 'var(--border)' },
  failed:        { label: "Failed",   icon: XCircle,      color: 'var(--error)',        bg: 'var(--error-light)',   border: 'var(--border)' },
  fallback:      { label: "Fallback", icon: RefreshCw,    color: 'var(--warning)',      bg: 'var(--warning-light)', border: 'var(--border)' },
  skipped:       { label: "Skipped",  icon: SkipForward,  color: 'var(--text-muted)',   bg: 'var(--surface-alt)',   border: 'var(--border)' },
  token_expired: { label: "Expired",  icon: XCircle,      color: 'var(--warning-dark)', bg: 'var(--warning-light)', border: 'var(--border)' },
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

function SkeletonEventRow() {
  return (
    <div className="flex items-start gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-9 h-9 rounded-xl animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--surface-alt)' }} />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
          <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
        </div>
        <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
      </div>
      <div className="h-6 w-20 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--surface-alt)' }} />
      <div className="flex-shrink-0 space-y-1">
        <div className="h-3 w-12 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
        <div className="h-2 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
      </div>
    </div>
  );
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
    <div
      className="flex items-start gap-4 px-6 py-4 last:border-0 transition-colors theme-transition"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-alt)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {/* Type icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: typeConf.bg, border: `1px solid ${typeConf.border}` }}
      >
        <TypeIcon size={15} style={{ color: typeConf.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: typeConf.color }}>{typeConf.label}</span>
          {event.from?.username ? (
            <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>@{event.from.username}</span>
          ) : event.from?.name ? (
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{event.from.name}</span>
          ) : event.from?.id ? (
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-placeholder)' }}>{event.from.id}</span>
          ) : null}
          {attachmentLabel && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ color: 'var(--text-placeholder)', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
            >
              {attachmentLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {thumbnail && (
            mediaLink ? (
              <a href={mediaLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img
                  src={thumbnail}
                  alt="media"
                  className="w-10 h-10 rounded-lg object-cover transition-colors"
                  style={{ border: '1px solid var(--border)' }}
                />
              </a>
            ) : (
              <img
                src={thumbnail}
                alt="media"
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                style={{ border: '1px solid var(--border)' }}
              />
            )
          )}
          <p className="text-[13px] truncate leading-tight" style={{ color: 'var(--text-muted)' }}>{displayText}</p>
        </div>
        {event.reply?.publicReply && event.content?.text && (
          <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--text-placeholder)' }}>
            <span className="font-bold">Public reply:</span> {event.reply.publicReply}
          </p>
        )}
        {event.reply?.dmText && (
          <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--text-placeholder)' }}>
            <span className="font-bold">DM sent:</span> {event.reply.dmText}
          </p>
        )}
      </div>

      {/* Reply status */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5"
        style={{ backgroundColor: statusConf.bg, border: `1px solid ${statusConf.border}` }}
      >
        <StatusIcon size={11} style={{ color: statusConf.color }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: statusConf.color }}>{statusConf.label}</span>
      </div>

      {/* Time */}
      <div className="text-right flex-shrink-0 mt-0.5">
        <p className="text-[11px]" style={{ color: 'var(--text-placeholder)' }}>{timeAgo(event.createdAt)}</p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
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
    <div className="space-y-8 theme-transition">
      {/* Header */}
      <div className="pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-5xl font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>Activity</h2>
        <p className="text-[14px] font-medium mt-2" style={{ color: 'var(--text-placeholder)' }}>
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
            <div
              key={type}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl"
              style={{ backgroundColor: conf.bg, border: `1px solid ${conf.border}` }}
            >
              <Icon size={14} style={{ color: conf.color }} />
              <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{count}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: conf.color }}>{conf.label}</span>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-2xl p-1.5 flex-wrap" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
        <Filter size={13} className="ml-2 mr-1" style={{ color: 'var(--text-placeholder)' }} />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
            style={activeFilter === f.key
              ? { backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
              : { color: 'var(--text-placeholder)', border: '1px solid transparent' }
            }
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto mr-2 text-[11px] font-bold" style={{ color: 'var(--text-placeholder)' }}>{events.length} events</span>
      </div>

      {/* Events list */}
      <div className="rounded-[28px] overflow-hidden shadow-sm theme-transition" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-3" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-alt)' }}>
          <div className="flex items-center gap-16">
            <span className="text-[10px] font-black uppercase tracking-widest w-24" style={{ color: 'var(--text-placeholder)' }}>Type</span>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>User · Content</span>
          </div>
          <div className="flex items-center gap-8 pr-2">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Reply</span>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>When</span>
          </div>
        </div>

        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => <SkeletonEventRow key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center">
            <ActivityIcon size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-placeholder)' }}>No activity yet.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Events appear here once your automation starts receiving interactions.</p>
          </div>
        ) : (
          events.map((event) => <EventRow key={event._id} event={event} />)
        )}
      </div>
    </div>
  );
}
