"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2, MessageSquare, MessageCircle, AtSign, Play, Heart,
  MousePointer2, Send, CheckCircle2, XCircle, RefreshCw, SkipForward,
  Activity as ActivityIcon, Filter, Pencil, Eye, EyeOff, Trash2, Check, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getAllInteractions } from '@/app/dashboard/actions';
import { editCommentOnInstagram, hideCommentOnInstagram, deleteCommentOnInstagram } from '@/app/dashboard/comment-actions';
import useActivityStream from '@/hooks/useActivityStream';
import LiveIndicator from './LiveIndicator';

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
  token_expired:  { label: "Expired",  icon: XCircle,      color: 'var(--warning-dark)', bg: 'var(--warning-light)', border: 'var(--border)' },
  quota_exceeded: { label: "Quota",    icon: XCircle,      color: 'var(--error)',        bg: 'var(--error-light)',   border: 'var(--border)' },
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

function shortTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

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

function DeleteConfirmDialog({ onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'var(--overlay)' }}>
      <div className="rounded-[24px] p-8 max-w-sm w-full space-y-6 shadow-2xl" style={{ backgroundColor: 'var(--card)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--error-light)' }}>
          <AlertTriangle size={22} style={{ color: 'var(--error)' }} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Delete comment?</h3>
          <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Are you sure you want to delete this comment? This will permanently remove it from Instagram.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--btn-destructive-bg)', color: 'var(--btn-destructive-text)' }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon: Icon, label, onClick, loading, variant = 'default', disabled }) {
  const colors = {
    default:  { color: 'var(--text-muted)', hoverColor: 'var(--primary)', hoverBg: 'var(--primary-light)' },
    danger:   { color: 'var(--text-muted)', hoverColor: 'var(--error)',   hoverBg: 'var(--error-light)' },
    success:  { color: 'var(--text-muted)', hoverColor: 'var(--success)', hoverBg: 'var(--success-light)' },
  };
  const c = colors[variant] || colors.default;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={label}
      aria-label={label}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
      style={{ color: c.color, backgroundColor: 'transparent' }}
      onMouseEnter={(e) => { if (!disabled && !loading) { e.currentTarget.style.color = c.hoverColor; e.currentTarget.style.backgroundColor = c.hoverBg; } }}
      onMouseLeave={(e) => { e.currentTarget.style.color = c.color; e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
    </button>
  );
}

function EventRow({ event, onEventUpdate }) {
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

  // Comment action state
  const hasCommentId = !!event.content?.commentId;
  const isCommentRow = event.type === 'comment' && hasCommentId;
  const isHidden = !!event.hidden;
  const isDeleted = !!event.deletedAt;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(event.content?.text || '');
  const [editLoading, setEditLoading] = useState(false);
  const [hideLoading, setHideLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEditSave = async () => {
    const trimmed = editText.trim();
    if (!trimmed) { toast.error('Comment text cannot be empty'); return; }
    if (trimmed === event.content?.text) { setEditing(false); return; }
    setEditLoading(true);
    const res = await editCommentOnInstagram(event._id, trimmed);
    setEditLoading(false);
    if (res.success) {
      toast.success('Comment updated on Instagram');
      onEventUpdate?.(event._id, { content: { ...event.content, text: res.updatedText }, editedAt: res.editedAt });
      setEditing(false);
    } else {
      toast.error(res.error || 'Failed to update comment');
    }
  };

  const handleEditCancel = () => {
    setEditText(event.content?.text || '');
    setEditing(false);
  };

  const handleToggleHide = async () => {
    setHideLoading(true);
    const res = await hideCommentOnInstagram(event._id, !isHidden);
    setHideLoading(false);
    if (res.success) {
      toast.success(res.hidden ? 'Comment hidden' : 'Comment unhidden');
      onEventUpdate?.(event._id, { hidden: res.hidden, hiddenAt: res.hiddenAt });
    } else {
      toast.error(res.error || 'Failed to toggle visibility');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    const res = await deleteCommentOnInstagram(event._id);
    setDeleteLoading(false);
    if (res.success) {
      toast.success('Comment deleted from Instagram');
      onEventUpdate?.(event._id, { deletedAt: res.deletedAt || new Date().toISOString() });
      setShowDeleteConfirm(false);
    } else {
      toast.error(res.error || 'Failed to delete comment');
    }
  };

  const dateStr = new Date(event.createdAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <>
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleteLoading}
        />
      )}
    <div
      className="flex items-start gap-4 px-6 py-4 last:border-0 transition-colors theme-transition"
      style={{
        borderBottom: '1px solid var(--border)',
        opacity: isDeleted ? 0.55 : 1,
      }}
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
          {/* Hidden badge */}
          {isHidden && !isDeleted && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-dark)', border: '1px solid var(--warning)' }}>
              Hidden
            </span>
          )}
          {/* Deleted badge */}
          {isDeleted && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error)' }}>
              Deleted
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
          {editing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') handleEditCancel();
                }}
                disabled={editLoading}
                autoFocus
                className="flex-1 text-[13px] px-2.5 py-1 rounded-lg outline-none transition-all"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--primary)', color: 'var(--input-text)' }}
              />
              <IconButton icon={Check} label="Save" onClick={handleEditSave} loading={editLoading} variant="success" />
              <IconButton icon={X} label="Cancel" onClick={handleEditCancel} disabled={editLoading} />
            </div>
          ) : (
            <p
              className="text-[13px] truncate leading-tight"
              style={{ color: 'var(--text-muted)', textDecoration: isDeleted ? 'line-through' : 'none' }}
            >
              {displayText}
            </p>
          )}
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
        {/* DM body — for DM rows, show the delivered content clearly */}
        {event.type === 'dm' && event.reply?.privateDM && (
          <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--text-placeholder)' }}>
            <span className="font-bold">DM content:</span> {event.reply.privateDM}
          </p>
        )}
        {/* Action log — visible audit trail for Meta reviewers */}
        {(event.editedAt || event.hiddenAt || event.deletedAt) && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {event.editedAt && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-medium)' }}>
                <Pencil size={9} /> Edited at {shortTime(event.editedAt)}
              </span>
            )}
            {event.hiddenAt && event.hidden && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-dark)', border: '1px solid var(--warning)' }}>
                <EyeOff size={9} /> Hidden at {shortTime(event.hiddenAt)}
              </span>
            )}
            {event.deletedAt && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error)' }}>
                <Trash2 size={9} /> Deleted at {shortTime(event.deletedAt)}
              </span>
            )}
          </div>
        )}

        {event.type === 'reel_share' && event.metadata?.categoryRuleName && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
              style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)', border: '1px solid var(--info)' }}>
              {event.metadata.categoryRuleName}
            </span>
            {event.content?.reelOwnerUsername && (
              <span className="text-[10px]" style={{ color: 'var(--text-placeholder)' }}>
                from @{event.content.reelOwnerUsername}
              </span>
            )}
          </div>
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

      {/* Comment action buttons — only on comment-type rows with a commentId */}
      {isCommentRow && !isDeleted && !editing && (
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg flex-shrink-0 mt-0.5"
          style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
        >
          <IconButton
            icon={Pencil}
            label="Edit comment"
            onClick={() => { setEditText(event.content?.text || ''); setEditing(true); }}
          />
          <IconButton
            icon={isHidden ? EyeOff : Eye}
            label={isHidden ? 'Unhide comment' : 'Hide comment'}
            onClick={handleToggleHide}
            loading={hideLoading}
          />
          <IconButton
            icon={Trash2}
            label="Delete comment"
            onClick={() => setShowDeleteConfirm(true)}
            variant="danger"
          />
        </div>
      )}

      {/* Time */}
      <div className="text-right flex-shrink-0 mt-0.5">
        <p className="text-[11px]" style={{ color: 'var(--text-placeholder)' }}>{timeAgo(event.createdAt)}</p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
      </div>
    </div>
    </>
  );
}

export default function Activity({ aiEnabled = false }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { events: liveEvents, isConnected } = useActivityStream();

  useEffect(() => {
    setLoading(true);
    const serverFilter = activeFilter === 'all' ? null : activeFilter === 'ai_detection' ? 'reel_share' : activeFilter;
    getAllInteractions(serverFilter)
      .then((data) => {
        if (activeFilter === 'ai_detection') {
          setEvents(data.filter(e => e.metadata?.matchType === 'ai_detection'));
        } else {
          setEvents(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeFilter]);

  const handleEventUpdate = (eventId, patch) => {
    setEvents((prev) => prev.map((e) => {
      if (e._id !== eventId) return e;
      // Deep-merge content if patched
      if (patch.content) {
        return { ...e, ...patch, content: { ...e.content, ...patch.content } };
      }
      return { ...e, ...patch };
    }));
  };

  const counts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 theme-transition">
      {/* Header */}
      <div className="pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-5xl font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>Activity</h2>
          <LiveIndicator isConnected={isConnected} />
        </div>
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
        {[...FILTERS, ...(aiEnabled ? [{ key: 'ai_detection', label: 'AI Detection' }] : [])].map((f) => (
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

        {liveEvents.length > 0 && !loading && (
          <div className="px-4 py-2.5 rounded-xl mb-2 flex items-center gap-2"
            style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success-light)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--success-dark)' }}>
              {liveEvents.length} new event{liveEvents.length > 1 ? 's' : ''} just arrived
            </span>
          </div>
        )}

        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => <SkeletonEventRow key={i} />)}
          </div>
        ) : events.length === 0 && liveEvents.length === 0 ? (
          <div className="py-20 text-center">
            <ActivityIcon size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-placeholder)' }}>No activity yet.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Events appear here once your automation starts receiving interactions.</p>
          </div>
        ) : (
          <>
            {liveEvents.map((event) => (
              <EventRow key={`live-${event.id}`} event={{
                _id: event.id, type: event.type, from: { username: event.senderUsername },
                content: { text: event.content }, reply: { status: event.replyStatus },
                createdAt: event.timestamp,
              }} />
            ))}
            {events.map((event) => <EventRow key={event._id} event={event} onEventUpdate={handleEventUpdate} />)}
          </>
        )}
      </div>
    </div>
  );
}
