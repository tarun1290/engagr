"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, Plus, MessageSquare, Share2, AtSign, Reply, ToggleLeft, ToggleRight,
  MoreVertical, Trash2, Copy, Zap, ChevronRight, X, ArrowRight, ArrowLeft,
  Check, ImageIcon, Eye, EyeOff, Pencil, Settings, MessageCircle, Clock,
  AlertTriangle, Mail, CornerDownLeft, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getInstagramAccount } from "@/app/dashboard/actions";
import {
  getAutomationsAction,
  createAutomationAction,
  updateAutomationAction,
  deleteAutomationAction,
  toggleAutomationAction,
  getAutomationActivityAction,
} from "@/app/dashboard/automation-actions";
import {
  getAccountMediaAction,
  getMediaCommentsAction,
  hideCommentAction,
  editCommentAction,
  deleteCommentAction,
  toggleMediaCommentsAction,
} from "@/app/dashboard/comment-actions";
import AutomationBuilder from "./automation/AutomationBuilder";

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  comment_to_dm: { label: "Comment to DM", icon: MessageSquare, color: "#4F46E5", bg: "#EEF2FF" },
  reel_share:    { label: "Reel Share",    icon: Share2,        color: "#0891B2", bg: "#ECFEFF" },
  mention_reply: { label: "Mention Reply", icon: AtSign,        color: "#D97706", bg: "#FFFBEB" },
  comment_reply: { label: "Comment Reply", icon: Reply,         color: "#059669", bg: "#ECFDF5" },
};

const TYPE_DESCRIPTIONS = {
  comment_to_dm: "Auto-reply to comments and send a DM with a link or message",
  reel_share:    "Reply when someone shares a reel with you in DMs",
  mention_reply: "Auto-reply when someone mentions your account",
  comment_reply: "Reply publicly to comments matching keywords",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(date) {
  if (!date) return "Never";
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function pctValue(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

function pct(a, b) {
  return `${pctValue(a, b)}%`;
}

function convColor(a, b) {
  const v = pctValue(a, b);
  if (!b) return "#A1A1AA";
  if (v > 50) return "#059669";
  if (v >= 20) return "#D97706";
  return "#DC2626";
}

// ── Small reusable pieces ──────────────────────────────────────────────────

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.comment_to_dm;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <cfg.icon size={10} /> {cfg.label}
    </span>
  );
}

function StatCell({ value, label }) {
  return (
    <div className="text-center px-3">
      <p className="text-sm font-semibold" style={{ color: "#18181B" }}>{value}</p>
      <p className="text-[10px]" style={{ color: "#A1A1AA" }}>{label}</p>
    </div>
  );
}

function ConvCell({ triggers, dmsSent }) {
  return (
    <div className="text-center px-3">
      <p className="text-sm font-semibold" style={{ color: convColor(dmsSent, triggers) }}>{pct(dmsSent, triggers)}</p>
      <p className="text-[10px]" style={{ color: "#A1A1AA" }}>Conv.</p>
    </div>
  );
}

function KeywordPill({ keyword }) {
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F4F4F5", color: "#52525B" }}>
      {keyword}
    </span>
  );
}

const REPLY_SUGGESTIONS = [
  "Check your DMs! \ud83d\udce9",
  "Sending you something special \ud83d\udc47",
  "Just sent you a DM! \ud83c\udf81",
  "Look out for my message! \ud83d\udcac",
  "Replied in your DMs \u2728",
];
const DM_SUGGESTIONS = [
  "Hey {{username}}! Here\u2019s what you asked for \ud83d\udc47",
  "Hi! Thanks for your interest \u2014 here\u2019s your link \ud83d\udd17",
  "Hey! You asked and we delivered \ud83c\udf81 Here it is:",
  "Thanks for reaching out, {{username}}! Here\u2019s the info:",
  "Hey {{username}}, here\u2019s your exclusive access \ud83d\udc47",
];
const DELIVERY_SUGGESTIONS = [
  "Here\u2019s your link! Tap below to access it \ud83c\udf81",
  "You\u2019re in! Click the button below to get started \ud83d\ude80",
  "All yours! Here\u2019s the direct link \ud83d\udc47",
  "Here it is \u2014 enjoy! \ud83d\ude4c",
  "Click below to access your content \u2728",
];

function SuggestionChips({ suggestions, onSelect }) {
  const [flashIdx, setFlashIdx] = useState(null);
  const handleClick = (text, idx) => {
    setFlashIdx(idx);
    onSelect(text);
    setTimeout(() => setFlashIdx(null), 300);
  };
  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A1A1AA" }}>Suggestions</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s, i) => (
          <button key={i} type="button" onClick={() => handleClick(s, i)}
            className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all"
            style={{ backgroundColor: flashIdx === i ? "#C7D2FE" : "#EEF2FF", color: "#4F46E5" }}
            onMouseEnter={e => { if (flashIdx !== i) e.currentTarget.style.backgroundColor = "#E0E7FF"; }}
            onMouseLeave={e => { if (flashIdx !== i) e.currentTarget.style.backgroundColor = "#EEF2FF"; }}>
            {flashIdx === i ? <Check size={11} className="inline -mt-px" /> : s}
          </button>
        ))}
      </div>
    </div>
  );
}

function EnableToggle({ enabled, loading, onChange }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onChange(!enabled); }} disabled={loading}
      className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: enabled ? "#059669" : "#D4D4D8", opacity: loading ? 0.5 : 1 }}>
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", enabled ? "left-5" : "left-0.5")} />
    </button>
  );
}

// ── Three-dot menu ─────────────────────────────────────────────────────────

function CardMenu({ onEdit, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-md transition-colors" style={{ color: "#71717A" }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F4F5"; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg py-1 z-20"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E4E7" }}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
            style={{ color: "#52525B" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#FAFAFA"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Pencil size={14} /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
            style={{ color: "#52525B" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#FAFAFA"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Copy size={14} /> Duplicate
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
            style={{ color: "#DC2626" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#FEF2F2"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Comment row inside detail view ─────────────────────────────────────────

function CommentItem({ comment, accountId, onUpdated }) {
  const [hiding, setHiding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text || "");
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isHidden = comment.hidden;

  const handleHide = async () => {
    setHiding(true);
    try {
      const res = await hideCommentAction(accountId, comment.id, !isHidden);
      if (res.success) { toast.success(isHidden ? "Comment unhidden" : "Comment hidden"); onUpdated(); }
      else toast.error(res.error || "Failed");
    } catch (e) { toast.error(e.message); }
    finally { setHiding(false); }
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === comment.text) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await editCommentAction(accountId, comment.id, editText.trim());
      if (res.success) { toast.success("Comment updated"); setEditing(false); onUpdated(); }
      else toast.error(res.error || "Only your own comments can be edited");
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteCommentAction(accountId, comment.id);
      if (res.success) { toast.success("Comment deleted"); onUpdated(); }
      else toast.error(res.error || "Failed");
    } catch (e) { toast.error(e.message); }
    finally { setDeleting(false); setConfirmDel(false); }
  };

  return (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-opacity" style={{ backgroundColor: "#FFFFFF", opacity: isHidden ? 0.5 : 1 }}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
        {(comment.from?.username || "?")[0].toUpperCase()}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: "#18181B" }}>@{comment.from?.username || "unknown"}</span>
          {isHidden && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Hidden</span>}
          <span className="text-[10px]" style={{ color: "#A1A1AA" }}>
            {comment.timestamp ? relativeTime(comment.timestamp) : ""}
          </span>
        </div>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <input value={editText} onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleEdit(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ border: "1px solid #C7D2FE", color: "#18181B" }} autoFocus />
            <button onClick={handleEdit} disabled={saving}
              className="p-1.5 rounded-md" style={{ color: "#059669" }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={() => { setEditing(false); setEditText(comment.text || ""); }}
              className="p-1.5 rounded-md" style={{ color: "#A1A1AA" }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "#52525B" }}>{comment.text}</p>
        )}
        {comment.like_count > 0 && <span className="text-[10px]" style={{ color: "#A1A1AA" }}>{comment.like_count} {comment.like_count === 1 ? "like" : "likes"}</span>}
      </div>
      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={handleHide} disabled={hiding} title={isHidden ? "Unhide" : "Hide"}
            className="p-1.5 rounded-md transition-colors" style={{ color: "#71717A" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F4F5"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            {hiding ? <Loader2 size={13} className="animate-spin" /> : isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button onClick={() => { setEditing(true); setEditText(comment.text || ""); }} title="Edit"
            className="p-1.5 rounded-md transition-colors" style={{ color: "#71717A" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#EEF2FF"; e.currentTarget.style.color = "#4F46E5"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#71717A"; }}>
            <Pencil size={13} />
          </button>
          {confirmDel ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDelete} disabled={deleting} className="px-2 py-1 rounded-md text-[10px] font-medium text-white" style={{ backgroundColor: "#DC2626" }}>
                {deleting ? <Loader2 size={10} className="animate-spin" /> : "Delete"}
              </button>
              <button onClick={() => setConfirmDel(false)} className="px-2 py-1 rounded-md text-[10px] font-medium" style={{ color: "#71717A", backgroundColor: "#F4F4F5" }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} title="Delete"
              className="p-1.5 rounded-md transition-colors" style={{ color: "#71717A" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#FEF2F2"; e.currentTarget.style.color = "#DC2626"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#71717A"; }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Comment skeleton ──────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-3 rounded-lg p-3 animate-pulse" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: "#F4F4F5" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded" style={{ backgroundColor: "#F4F4F5" }} />
            <div className="h-3 w-full rounded" style={{ backgroundColor: "#F4F4F5" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Comment Manager Tab ───────────────────────────────────────────────────

function CommentManagerTab({ automation, accountId }) {
  const [media, setMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [togglingComments, setTogglingComments] = useState(false);

  // For post_specific, use the automation's mediaIds; for account_wide, fetch recent media
  useEffect(() => {
    if (automation.scope === "account_wide") {
      setLoadingMedia(true);
      getAccountMediaAction(accountId).then(res => {
        if (res.success) setMedia(res.media || []);
      }).catch(() => {}).finally(() => setLoadingMedia(false));
    }
  }, [automation.scope, accountId]);

  const selectedPost = media.find(p => p.id === selectedPostId);

  const loadComments = useCallback(async (postId) => {
    setSelectedPostId(postId);
    setLoadingComments(true);
    setCommentsEnabled(true);
    try {
      const res = await getMediaCommentsAction(accountId, postId);
      if (res.success) setComments(res.comments || []);
      else toast.error(res.error || "Failed to load comments");
    } catch (e) { toast.error(e.message); }
    finally { setLoadingComments(false); }
  }, [accountId]);

  const refreshComments = useCallback(() => {
    if (selectedPostId) loadComments(selectedPostId);
  }, [selectedPostId, loadComments]);

  const handleToggleComments = async () => {
    if (!selectedPostId) return;
    setTogglingComments(true);
    const next = !commentsEnabled;
    try {
      const res = await toggleMediaCommentsAction(accountId, selectedPostId, next);
      if (res.success) { setCommentsEnabled(next); toast.success(next ? "Comments enabled" : "Comments disabled"); }
      else toast.error(res.error || "Failed");
    } catch (e) { toast.error(e.message); }
    finally { setTogglingComments(false); }
  };

  // Post-specific: show automations's selected posts as post selector
  const postIds = automation.scope === "post_specific" ? (automation.mediaIds || []) : [];

  return (
    <div className="space-y-4">
      {/* Post selector */}
      {automation.scope === "account_wide" ? (
        loadingMedia ? (
          <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: "#4F46E5" }} /></div>
        ) : media.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "#71717A" }}>No posts found. Publish content on Instagram to manage comments.</p>
        ) : (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "#A1A1AA" }}>Select a post</p>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {media.map(p => {
                const thumb = p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url;
                const sel = selectedPostId === p.id;
                return (
                  <button key={p.id} onClick={() => loadComments(p.id)}
                    className="flex-shrink-0 w-20 rounded-lg overflow-hidden transition-all"
                    style={{ border: sel ? "2px solid #4F46E5" : "1px solid #E4E4E7", opacity: sel ? 1 : 0.65 }}>
                    <div className="aspect-square w-full" style={{ backgroundColor: "#F4F4F5" }}>
                      {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} style={{ color: "#A1A1AA" }} /></div>}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 py-1">
                      <MessageCircle size={8} style={{ color: "#A1A1AA" }} />
                      <span className="text-[9px]" style={{ color: "#A1A1AA" }}>{p.comments_count ?? 0}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )
      ) : (
        postIds.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "#71717A" }}>No posts selected for this automation.</p>
        ) : (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "#A1A1AA" }}>Automation posts</p>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {postIds.map(pid => {
                const sel = selectedPostId === pid;
                return (
                  <button key={pid} onClick={() => loadComments(pid)}
                    className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={sel ? { backgroundColor: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE" } : { backgroundColor: "#FFFFFF", color: "#71717A", border: "1px solid #E4E4E7" }}>
                    {pid.slice(-6)}
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Post controls + comments */}
      {selectedPostId && (
        <div className="space-y-3">
          {/* Post-level controls */}
          <div className="rounded-lg p-3 flex items-center justify-between gap-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0F0F0" }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "#18181B" }}>
                {selectedPost?.caption || `Post ...${selectedPostId.slice(-6)}`}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#A1A1AA" }}>
                {selectedPost?.comments_count ?? comments.length} comments
              </p>
            </div>
            <button onClick={handleToggleComments} disabled={togglingComments}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex-shrink-0"
              style={commentsEnabled ? { backgroundColor: "#ECFDF5", color: "#059669" } : { backgroundColor: "#F4F4F5", color: "#A1A1AA" }}>
              {togglingComments ? <Loader2 size={12} className="animate-spin" /> : commentsEnabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
              {commentsEnabled ? "Comments on" : "Comments off"}
            </button>
          </div>

          {/* Comments list */}
          {loadingComments ? <CommentSkeleton /> : comments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <MessageCircle size={18} style={{ color: "#A1A1AA" }} className="mb-2" />
              <p className="text-sm" style={{ color: "#71717A" }}>No comments on this post yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {comments.map(c => <CommentItem key={c.id} comment={c} accountId={accountId} onUpdated={refreshComments} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab (edit form) ──────────────────────────────────────────────

function SettingsTab({ automation, accountId, onUpdated }) {
  const [name, setName] = useState(automation.name);
  const [scope, setScope] = useState(automation.scope || "account_wide");
  const [mediaIds, setMediaIds] = useState(automation.mediaIds || []);
  const [keywords, setKeywords] = useState(automation.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(automation.commentReply?.enabled ?? true);
  const [replyMessages, setReplyMessages] = useState(() => {
    const msgs = automation.commentReply?.messages;
    return msgs?.length ? [...msgs] : [automation.commentReply?.message || "Check your DMs! \ud83d\udce9"];
  });
  const [dmMessage, setDmMessage] = useState(automation.dmMessage || "");
  const [linkUrl, setLinkUrl] = useState(automation.linkUrl || "");
  const [buttonText, setButtonText] = useState(automation.buttonText || "Get the link \u2192");
  const [deliveryMessage, setDeliveryMessage] = useState(automation.deliveryMessage || "");
  const [deliveryButtonText, setDeliveryButtonText] = useState(automation.deliveryButtonText || "");
  const [followUpEnabled, setFollowUpEnabled] = useState(automation.followUp?.enabled ?? false);
  const [followUpQuestion, setFollowUpQuestion] = useState(automation.followUp?.question || "");
  const [followUpOptions, setFollowUpOptions] = useState(() => {
    const opts = automation.followUp?.options;
    return opts?.length >= 2 ? [...opts] : ["", ""];
  });
  const [followUpResponse, setFollowUpResponse] = useState(automation.followUp?.response || "");
  const [followerGateEnabled, setFollowerGateEnabled] = useState(automation.followerGate?.enabled ?? false);
  const [followerGateMessage, setFollowerGateMessage] = useState(automation.followerGate?.nonFollowerMessage || "Follow us first to get access!");
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [media, setMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !keywords.includes(k)) setKeywords(prev => [...prev, k]);
    setKeywordInput("");
  };

  const fetchMedia = useCallback(async () => {
    if (media.length > 0 || loadingMedia) return;
    setLoadingMedia(true);
    try {
      const res = await getAccountMediaAction(accountId);
      if (res.success) setMedia(res.media || []);
    } catch {}
    finally { setLoadingMedia(false); }
  }, [accountId, media.length, loadingMedia]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const safeMessages = Array.isArray(replyMessages)
        ? replyMessages.filter(m => typeof m === "string" && m.trim())
        : [];
      const safeFuOpts = Array.isArray(followUpOptions)
        ? followUpOptions.filter(o => typeof o === "string" && o.trim())
        : [];
      const safeKw = Array.isArray(keywords) ? keywords : [];

      const payload = {
        name: String(name || ""),
        scope: String(scope || "account_wide"),
        mediaIds: scope === "post_specific" ? (Array.isArray(mediaIds) ? mediaIds : []) : [],
        keywords: safeKw,
        commentReply: {
          enabled: Boolean(commentReplyEnabled),
          messages: safeMessages.length > 0 ? safeMessages : ["Check your DMs! \ud83d\udce9"],
        },
        dmMessage: String(dmMessage || ""),
        linkUrl: String(linkUrl || ""),
        buttonText: String(buttonText || ""),
        deliveryMessage: String(deliveryMessage || ""),
        deliveryButtonText: String(deliveryButtonText || ""),
        followUp: {
          enabled: Boolean(followUpEnabled),
          question: String(followUpQuestion || ""),
          options: safeFuOpts.length >= 2 ? safeFuOpts : ["Option 1", "Option 2"],
          response: String(followUpResponse || ""),
        },
        followerGate: {
          enabled: Boolean(followerGateEnabled),
          nonFollowerMessage: String(followerGateMessage || ""),
        },
      };

      const res = await updateAutomationAction(String(automation._id), payload);

      if (res && res.success) {
        toast.success("Automation saved!");
        if (typeof onUpdated === "function") onUpdated(res.automation);
      } else {
        toast.error((res && res.error) || "Failed to save");
      }
    } catch (e) {
      console.error("[UpdateAutomation] Error:", e);
      toast.error(typeof e === "object" && e !== null && e.message ? e.message : "Something went wrong");
    }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
          style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
      </div>

      {/* Scope */}
      <div>
        <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Scope</label>
        <div className="flex gap-2">
          {["account_wide", "post_specific"].map(s => (
            <button key={s} onClick={() => setScope(s)}
              className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={scope === s
                ? { backgroundColor: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE" }
                : { backgroundColor: "#FFFFFF", color: "#71717A", border: "1px solid #E4E4E7" }}>
              {s === "account_wide" ? "All posts" : "Specific posts"}
            </button>
          ))}
        </div>
      </div>

      {/* Selected posts */}
      {scope === "post_specific" && (
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>
            Selected posts ({mediaIds.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {mediaIds.map(id => (
              <span key={id} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: "#F4F4F5", color: "#52525B" }}>
                ...{id.slice(-6)}
                <button onClick={() => setMediaIds(prev => prev.filter(x => x !== id))}>
                  <X size={10} style={{ color: "#A1A1AA" }} />
                </button>
              </span>
            ))}
            <button onClick={() => { setShowMediaPicker(true); fetchMedia(); }}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ border: "1px dashed #C7D2FE", color: "#4F46E5" }}>
              <Plus size={12} /> Add Post
            </button>
          </div>
          {showMediaPicker && (
            <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E4E7" }}>
              {loadingMedia ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin" style={{ color: "#4F46E5" }} /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
                    {media.map(p => {
                      const sel = mediaIds.includes(p.id);
                      const thumb = p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url;
                      return (
                        <div key={p.id} onClick={() => setMediaIds(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                          className="relative aspect-square rounded-md overflow-hidden cursor-pointer transition-all"
                          style={{ opacity: sel ? 1 : 0.6, border: sel ? "2px solid #4F46E5" : "1px solid #E4E4E7" }}>
                          {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F4F4F5" }}><ImageIcon size={12} style={{ color: "#A1A1AA" }} /></div>}
                          {sel && <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(79,70,229,0.25)" }}><Check size={14} className="text-white" /></div>}
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => setShowMediaPicker(false)}
                    className="mt-2 text-xs font-medium" style={{ color: "#4F46E5" }}>Done</button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Keywords */}
      <div>
        <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>
          Keywords <span className="normal-case font-normal">(empty = match all)</span>
        </label>
        <div className="flex gap-2">
          <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
            placeholder="Type and press Enter"
            className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
            style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
          <button onClick={addKeyword} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "#4F46E5" }}>Add</button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {keywords.map(k => (
              <span key={k} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md"
                style={{ backgroundColor: "#F4F4F5", color: "#52525B" }}>
                {k}
                <button onClick={() => setKeywords(prev => prev.filter(x => x !== k))}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── PUBLIC COMMENT REPLY — rotating variants ──────────── */}
      <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Public Comment Reply</label>
          <EnableToggle enabled={commentReplyEnabled} onChange={setCommentReplyEnabled} />
        </div>
        {commentReplyEnabled && (
          <div className="space-y-2">
            <p className="text-[10px]" style={{ color: "#71717A" }}>Engagr will rotate through these replies randomly so your responses look more natural.</p>
            {replyMessages.map((msg, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input value={msg} onChange={e => { const next = [...replyMessages]; next[idx] = e.target.value; setReplyMessages(next); }}
                  placeholder={`Reply variant ${idx + 1}`}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                {replyMessages.length > 1 && (
                  <button onClick={() => setReplyMessages(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-md" style={{ color: "#A1A1AA" }}><Trash2 size={13} /></button>
                )}
              </div>
            ))}
            {replyMessages.length < 5 && (
              <button onClick={() => setReplyMessages(prev => [...prev, ""])}
                className="flex items-center gap-1 text-xs font-medium pt-1" style={{ color: "#4F46E5" }}>
                <Plus size={12} /> Add variant
              </button>
            )}
            <SuggestionChips suggestions={REPLY_SUGGESTIONS} onSelect={(t) => setReplyMessages(prev => { const next = [...prev]; next[0] = t; return next; })} />
            <p className="text-[10px]" style={{ color: "#A1A1AA" }}>{"Use {{username}} or {{keyword}} as template variables"}</p>
          </div>
        )}
      </div>

      {/* ── DM MESSAGE ────────────────────────────────────────── */}
      <div>
        <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>DM Message</label>
        <textarea value={dmMessage} onChange={e => setDmMessage(e.target.value)} rows={3}
          placeholder="Hey! Thanks for your interest..."
          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
          style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
        <SuggestionChips suggestions={DM_SUGGESTIONS} onSelect={setDmMessage} />
      </div>

      {/* ── LINK URL + BUTTON ─────────────────────────────────── */}
      <div>
        <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Link URL</label>
        <div className="relative">
          <input value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onBlur={() => { if (linkUrl && !linkUrl.startsWith("http://") && !linkUrl.startsWith("https://")) setLinkUrl("https://" + linkUrl); }}
            placeholder="https://yoursite.com/offer"
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none pr-8"
            style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
          {linkUrl.startsWith("http") && (
            <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#059669" }} />
          )}
        </div>
        <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>The URL your follower will be sent to</p>
      </div>
      <div style={{ opacity: linkUrl ? 1 : 0.4, transition: "opacity 0.2s", pointerEvents: linkUrl ? "auto" : "none" }}>
        <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Button Label</label>
        <input value={buttonText} onChange={e => setButtonText(e.target.value.slice(0, 25))}
          placeholder="Get the link →"
          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
          style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
        <div className="flex justify-between mt-1">
          <p className="text-[10px]" style={{ color: "#A1A1AA" }}>Text on the clickable button in the DM</p>
          <span className="text-[10px]" style={{ color: buttonText.length >= 25 ? "#DC2626" : "#A1A1AA" }}>{buttonText.length}/25</span>
        </div>
      </div>

      {/* ── DELIVERY MESSAGE + BUTTON ─────────────────────────── */}
      <div>
        <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Delivery Message</label>
        <textarea value={deliveryMessage} onChange={e => setDeliveryMessage(e.target.value)} rows={2}
          placeholder="Here's your link! Tap below to access it 🎁"
          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
          style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
        <SuggestionChips suggestions={DELIVERY_SUGGESTIONS} onSelect={setDeliveryMessage} />
        <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>Sent after the user confirms. Leave blank to skip the confirmation step.</p>
      </div>
      <div style={{ opacity: deliveryMessage ? 1 : 0.4, transition: "opacity 0.2s", pointerEvents: deliveryMessage ? "auto" : "none" }}>
        <label className="text-[10px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Delivery Button Label</label>
        <input value={deliveryButtonText} onChange={e => setDeliveryButtonText(e.target.value.slice(0, 25))}
          placeholder="Access now →"
          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
          style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
        <div className="flex justify-end mt-1">
          <span className="text-[10px]" style={{ color: deliveryButtonText.length >= 25 ? "#DC2626" : "#A1A1AA" }}>{deliveryButtonText.length}/25</span>
        </div>
      </div>

      {/* ── FOLLOW-UP QUESTION ────────────────────────────────── */}
      <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Follow-Up Question</label>
          <EnableToggle enabled={followUpEnabled} onChange={setFollowUpEnabled} />
        </div>
        {followUpEnabled && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: "#A1A1AA" }}>Question</label>
              <input value={followUpQuestion} onChange={e => setFollowUpQuestion(e.target.value)}
                placeholder="What type of content are you interested in?"
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
              <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>Engagr will send this question after the initial DM is delivered.</p>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: "#A1A1AA" }}>Quick Reply Options</label>
              <p className="text-[10px] mb-2" style={{ color: "#A1A1AA" }}>Users tap one of these to reply instantly.</p>
              <div className="space-y-2">
                {followUpOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input value={opt} onChange={e => { const next = [...followUpOptions]; next[idx] = e.target.value; setFollowUpOptions(next); }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
                      style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                    {followUpOptions.length > 2 && (
                      <button onClick={() => setFollowUpOptions(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-md" style={{ color: "#A1A1AA" }}><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
                {followUpOptions.length < 4 && (
                  <button onClick={() => setFollowUpOptions(prev => [...prev, ""])}
                    className="flex items-center gap-1 text-xs font-medium pt-1" style={{ color: "#4F46E5" }}>
                    <Plus size={12} /> Add option
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: "#A1A1AA" }}>Auto-Response</label>
              <textarea value={followUpResponse} onChange={e => setFollowUpResponse(e.target.value)} rows={2}
                placeholder="Thanks for letting us know! We'll send you relevant content shortly."
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
              <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>Engagr sends this message regardless of which option the user picks.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── FOLLOWER GATE ─────────────────────────────────────── */}
      <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Follower Gate</label>
          <EnableToggle enabled={followerGateEnabled} onChange={setFollowerGateEnabled} />
        </div>
        {followerGateEnabled && (
          <input value={followerGateMessage} onChange={e => setFollowerGateMessage(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
            style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2" style={{ borderTop: "1px solid #F0F0F0" }}>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#4F46E5" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Detail view (expanded panel) ──────────────────────────────────────────

// ── Activity Tab ──────────────────────────────────────────────────────────

const EVENT_ICON_MAP = {
  comment_sent:   { icon: MessageSquare, color: "#4F46E5", bg: "#EEF2FF", label: "Comment detected" },
  reply_sent:     { icon: CornerDownLeft, color: "#059669", bg: "#ECFDF5", label: "Reply sent" },
  dm_sent:        { icon: Mail,           color: "#0891B2", bg: "#ECFEFF", label: "DM sent" },
  comment_hide:   { icon: EyeOff,        color: "#D97706", bg: "#FFFBEB", label: "Comment hidden" },
  comment_delete: { icon: Trash2,         color: "#DC2626", bg: "#FEF2F2", label: "Comment deleted" },
  reply_failed:   { icon: XCircle,        color: "#DC2626", bg: "#FEF2F2", label: "Reply failed" },
  dm_failed:      { icon: AlertTriangle,  color: "#D97706", bg: "#FFFBEB", label: "DM failed" },
};

function classifyEvent(ev) {
  const status = ev.reply?.status;
  if (status === "sent" && ev.reply?.privateDM) return "dm_sent";
  if (status === "sent" && ev.reply?.publicReply) return "reply_sent";
  if (status === "failed" && ev.reply?.privateDM) return "dm_failed";
  if (status === "failed") return "reply_failed";
  if (status === "token_expired") return "dm_failed";
  if (ev.type === "comment_hide") return "comment_hide";
  if (ev.type === "comment_delete") return "comment_delete";
  return "comment_sent";
}

function ActivityTab({ automation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (p) => {
    const isFirst = p === 1;
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const res = await getAutomationActivityAction(automation._id, p, 20);
      if (res.success) {
        setEvents(prev => isFirst ? res.events : [...prev, ...res.events]);
        setHasMore(res.hasMore);
        setTotalCount(res.totalCount);
        setPage(p);
      } else {
        toast.error(res.error || "Failed to load activity");
      }
    } catch (e) { toast.error(e.message); }
    finally { if (isFirst) setLoading(false); else setLoadingMore(false); }
  }, [automation._id]);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: "#F4F4F5" }} />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "#F4F4F5" }} />
              <div className="h-3 w-1/2 rounded" style={{ backgroundColor: "#F4F4F5" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Clock size={20} style={{ color: "#A1A1AA" }} className="mb-2" />
        <p className="text-sm font-medium" style={{ color: "#71717A" }}>No activity yet</p>
        <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>This automation hasn&apos;t been triggered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((ev, idx) => {
        const kind = classifyEvent(ev);
        const cfg = EVENT_ICON_MAP[kind] || EVENT_ICON_MAP.comment_sent;
        const Icon = cfg.icon;
        const username = ev.from?.username;
        const text = ev.content?.text;
        const isLast = idx === events.length - 1;

        return (
          <div key={ev._id || idx} className="flex items-start gap-3 py-2.5">
            {/* Timeline icon + connector */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                <Icon size={14} style={{ color: cfg.color }} />
              </div>
              {!isLast && <div className="w-px flex-1 mt-1" style={{ backgroundColor: "#F0F0F0", minHeight: 16 }} />}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 -mt-0.5">
              <p className="text-xs font-medium" style={{ color: "#18181B" }}>
                {cfg.label}
                {username && <span style={{ color: "#4F46E5" }}> @{username}</span>}
              </p>
              {text && (
                <p className="text-[11px] mt-0.5 truncate" style={{ color: "#71717A" }}>
                  &ldquo;{text.length > 80 ? text.slice(0, 80) + "..." : text}&rdquo;
                </p>
              )}
              {ev.reply?.publicReply && kind === "reply_sent" && (
                <p className="text-[11px] mt-0.5" style={{ color: "#059669" }}>
                  Replied: &ldquo;{ev.reply.publicReply.length > 60 ? ev.reply.publicReply.slice(0, 60) + "..." : ev.reply.publicReply}&rdquo;
                </p>
              )}
              {ev.reply?.privateDM && kind === "dm_sent" && (
                <p className="text-[11px] mt-0.5" style={{ color: "#0891B2" }}>DM sent successfully</p>
              )}
              {(kind === "reply_failed" || kind === "dm_failed") && (
                <p className="text-[11px] mt-0.5" style={{ color: "#DC2626" }}>
                  {ev.reply?.status === "token_expired" ? "Token expired" : "Delivery failed"}
                </p>
              )}
              <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>{relativeTime(ev.createdAt)}</p>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-3">
          <button onClick={() => fetchPage(page + 1)} disabled={loadingMore}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ color: "#4F46E5", backgroundColor: "#EEF2FF" }}>
            {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
            {loadingMore ? "Loading..." : `Load more (${totalCount - events.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}

const DETAIL_TABS = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "comments", label: "Comment Manager", icon: MessageCircle },
  { id: "activity", label: "Activity", icon: Clock },
];

function DetailView({ automation, accountId, onUpdated }) {
  const [tab, setTab] = useState("settings");

  return (
    <div>
      {/* Inner tabs */}
      <div className="flex gap-1 mb-4">
        {DETAIL_TABS.map(t => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={active
                ? { backgroundColor: "#EEF2FF", color: "#4F46E5" }
                : { backgroundColor: "transparent", color: "#71717A" }
              }
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = "#FAFAFA"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = active ? "#EEF2FF" : "transparent"; }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "settings" && <SettingsTab automation={automation} accountId={accountId} onUpdated={onUpdated} />}
      {tab === "comments" && <CommentManagerTab automation={automation} accountId={accountId} />}
      {tab === "activity" && <ActivityTab automation={automation} />}
    </div>
  );
}

// ── Automation card ────────────────────────────────────────────────────────

function AutomationCard({ automation, expandedId, onExpand, onToggle, onDuplicate, onDelete, onEdit, togglingId, accountId, onAutomationUpdated }) {
  const a = automation;
  const isExpanded = expandedId === a._id;

  return (
    <div className={cn("rounded-xl overflow-hidden transition-all", !a.enabled && !isExpanded && "opacity-60")}
      style={{ backgroundColor: "#FFFFFF", border: isExpanded ? "1px solid #C7D2FE" : "1px solid #F0F0F0" }}>
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => onExpand(isExpanded ? null : a._id)}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = "#FAFAFA"; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>

        {/* Left: name + meta */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate" style={{ color: "#18181B" }}>{a.name}</p>
            <TypeBadge type={a.type} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px]" style={{ color: "#71717A" }}>
              {a.scope === "post_specific" ? `Specific posts (${a.mediaIds?.length || 0})` : "All posts"}
            </span>
            {a.keywords?.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {a.keywords.slice(0, 5).map(k => <KeywordPill key={k} keyword={k} />)}
                {a.keywords.length > 5 && (
                  <span className="text-[10px]" style={{ color: "#A1A1AA" }}>+{a.keywords.length - 5}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats row — hidden on small screens */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          <StatCell value={a.stats?.triggers || 0} label="Triggers" />
          <StatCell value={a.stats?.repliesSent || 0} label="Replies" />
          <StatCell value={a.stats?.dmsSent || 0} label="DMs" />
          <ConvCell triggers={a.stats?.triggers || 0} dmsSent={a.stats?.dmsSent || 0} />
          <div className="text-center px-3">
            <p className="text-[11px] font-medium" style={{ color: "#71717A" }}>{relativeTime(a.stats?.lastTriggeredAt)}</p>
            <p className="text-[10px]" style={{ color: "#A1A1AA" }}>Last active</p>
          </div>
        </div>

        {/* Toggle + menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <EnableToggle enabled={a.enabled} loading={togglingId === a._id} onChange={(v) => onToggle(a._id, v)} />
          <CardMenu onEdit={() => onEdit(a)} onDuplicate={() => onDuplicate(a)} onDelete={() => onDelete(a)} />
          <ChevronRight size={16} className={cn("transition-transform duration-200", isExpanded && "rotate-90")} style={{ color: "#A1A1AA" }} />
        </div>
      </div>

      {/* Expanded detail view */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-4 animate-in slide-in-from-top-2 fade-in duration-200" style={{ borderTop: "1px solid #F0F0F0", backgroundColor: "#FAFAFA" }}>
          {/* Mobile stats */}
          <div className="flex md:hidden items-center gap-1 mb-4 pb-4 flex-wrap" style={{ borderBottom: "1px solid #F0F0F0" }}>
            <StatCell value={a.stats?.triggers || 0} label="Triggers" />
            <StatCell value={a.stats?.repliesSent || 0} label="Replies" />
            <StatCell value={a.stats?.dmsSent || 0} label="DMs" />
            <ConvCell triggers={a.stats?.triggers || 0} dmsSent={a.stats?.dmsSent || 0} />
          </div>
          <DetailView automation={a} accountId={accountId} onUpdated={onAutomationUpdated} />
        </div>
      )}
    </div>
  );
}

// ── Create modal ───────────────────────────────────────────────────────────

function CreateModal({ accountId, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [name, setName] = useState("");
  const [scope, setScope] = useState("account_wide");
  const [mediaIds, setMediaIds] = useState([]);
  const [media, setMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(true);
  const [replyMessages, setReplyMessages] = useState(["Check your DMs! \ud83d\udce9"]);
  const [dmMessage, setDmMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [buttonText, setButtonText] = useState("Get the link \u2192");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryButtonText, setDeliveryButtonText] = useState("");
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpOptions, setFollowUpOptions] = useState(["", ""]);
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [followerGateEnabled, setFollowerGateEnabled] = useState(false);
  const [followerGateMessage, setFollowerGateMessage] = useState("Follow us first to get access!");
  const [creating, setCreating] = useState(false);

  // Fetch media when "Specific posts" is selected
  useEffect(() => {
    if (scope === "post_specific" && media.length === 0 && !loadingMedia) {
      setLoadingMedia(true);
      getAccountMediaAction(accountId).then(res => {
        if (res.success) setMedia(res.media || []);
      }).catch(() => {}).finally(() => setLoadingMedia(false));
    }
  }, [scope, accountId, media.length, loadingMedia]);

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !keywords.includes(k)) setKeywords(prev => [...prev, k]);
    setKeywordInput("");
  };

  const handleCreate = async () => {
    setCreating(true);
    let res;
    try {
      res = await createAutomationAction(accountId, {
        name: name || "",
        type: selectedType || "",
        scope: scope || "account_wide",
        mediaIds: scope === "post_specific" ? mediaIds || [] : [],
        keywords: keywords || [],
        commentReply: {
          enabled: !!commentReplyEnabled,
          messages: Array.isArray(replyMessages) ? replyMessages.filter(Boolean) : [],
        },
        dmMessage: dmMessage || "",
        linkUrl: linkUrl || "",
        buttonText: buttonText || "",
        deliveryMessage: deliveryMessage || "",
        deliveryButtonText: deliveryButtonText || "",
        followUp: {
          enabled: !!followUpEnabled,
          question: followUpQuestion || "",
          options: Array.isArray(followUpOptions) ? followUpOptions.filter(Boolean) : [],
          response: followUpResponse || "",
        },
        followerGate: {
          enabled: !!followerGateEnabled,
          nonFollowerMessage: followerGateMessage || "",
        },
      });
    } catch (e) {
      console.error("[CreateAutomation] call failed:", e);
      toast.error("Failed: " + (e && e.message ? e.message : String(e)));
      setCreating(false);
      return;
    }
    setCreating(false);
    if (res && res.success) {
      toast.success("Automation created!");
      onCreated(res.automation);
      onClose();
    } else {
      toast.error(res ? res.error || "Failed to create" : "No response from server");
    }
  };

  const canProceedStep2 = selectedType !== null;
  const canProceedStep3 = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"
        style={{ backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#18181B" }}>
              {step === 1 ? "Choose Type" : step === 2 ? "Configure" : "Review & Create"}
            </h2>
            <p className="text-xs" style={{ color: "#A1A1AA" }}>Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md" style={{ color: "#71717A" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F4F5"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ── Step 1: Choose type ──────────────────────────────────── */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                const selected = selectedType === type;
                return (
                  <button key={type} onClick={() => setSelectedType(type)}
                    className="rounded-xl p-4 text-left transition-all"
                    style={{
                      border: selected ? `2px solid ${cfg.color}` : "1px solid #E4E4E7",
                      backgroundColor: selected ? cfg.bg : "#FFFFFF",
                    }}>
                    <cfg.icon size={20} style={{ color: cfg.color }} className="mb-2" />
                    <p className="text-sm font-semibold" style={{ color: "#18181B" }}>{cfg.label}</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#71717A" }}>{TYPE_DESCRIPTIONS[type]}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step 2: Configure ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder='e.g. "Summer Sale Promo"'
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
              </div>

              {/* Scope */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Scope</label>
                <div className="flex gap-2">
                  {["account_wide", "post_specific"].map(s => (
                    <button key={s} onClick={() => setScope(s)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                      style={scope === s
                        ? { backgroundColor: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE" }
                        : { backgroundColor: "#FFFFFF", color: "#71717A", border: "1px solid #E4E4E7" }
                      }>
                      {s === "account_wide" ? "All posts" : "Specific posts"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media picker */}
              {scope === "post_specific" && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>
                    Select posts {mediaIds.length > 0 && `(${mediaIds.length} selected)`}
                  </label>
                  {loadingMedia ? (
                    <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" style={{ color: "#4F46E5" }} /></div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                      {media.map(p => {
                        const sel = mediaIds.includes(p.id);
                        const thumb = p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url;
                        return (
                          <div key={p.id} onClick={() => setMediaIds(prev => sel ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all"
                            style={{ opacity: sel ? 1 : 0.6, border: sel ? "2px solid #4F46E5" : "1px solid #E4E4E7" }}>
                            {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F4F4F5" }}><ImageIcon size={16} style={{ color: "#A1A1AA" }} /></div>}
                            {sel && (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(79,70,229,0.3)" }}>
                                <Check size={18} className="text-white" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Keywords */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>
                  Keywords <span className="normal-case font-normal">(leave empty to match all comments)</span>
                </label>
                <div className="flex gap-2">
                  <input value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                    placeholder="Type a keyword and press Enter"
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
                    style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                  <button onClick={addKeyword} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: "#4F46E5" }}>Add</button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {keywords.map(k => (
                      <span key={k} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md"
                        style={{ backgroundColor: "#F4F4F5", color: "#52525B" }}>
                        {k}
                        <button onClick={() => setKeywords(prev => prev.filter(x => x !== k))} className="ml-0.5">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── PUBLIC COMMENT REPLY — rotating variants ──────────── */}
              <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Public Comment Reply</label>
                  <EnableToggle enabled={commentReplyEnabled} onChange={setCommentReplyEnabled} />
                </div>
                {commentReplyEnabled && (
                  <div className="space-y-2">
                    <p className="text-[10px]" style={{ color: "#71717A" }}>Engagr will rotate through these replies randomly so your responses look more natural.</p>
                    {replyMessages.map((msg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input value={msg} onChange={e => { const next = [...replyMessages]; next[idx] = e.target.value; setReplyMessages(next); }}
                          placeholder={`Reply variant ${idx + 1}`}
                          className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
                          style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                        {replyMessages.length > 1 && (
                          <button onClick={() => setReplyMessages(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-md" style={{ color: "#A1A1AA" }}><Trash2 size={13} /></button>
                        )}
                      </div>
                    ))}
                    {replyMessages.length < 5 && (
                      <button onClick={() => setReplyMessages(prev => [...prev, ""])}
                        className="flex items-center gap-1 text-xs font-medium pt-1" style={{ color: "#4F46E5" }}>
                        <Plus size={12} /> Add variant
                      </button>
                    )}
                    <SuggestionChips suggestions={REPLY_SUGGESTIONS} onSelect={(t) => setReplyMessages(prev => { const next = [...prev]; next[0] = t; return next; })} />
                    <p className="text-[10px]" style={{ color: "#A1A1AA" }}>
                      {"Use {{username}} for the commenter's name, {{keyword}} for the matched keyword"}
                    </p>
                  </div>
                )}
              </div>

              {/* ── DM MESSAGE ────────────────────────────────────────── */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>DM Message</label>
                <textarea value={dmMessage} onChange={e => setDmMessage(e.target.value)} rows={3}
                  placeholder="Hey! Thanks for your interest..."
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                <SuggestionChips suggestions={DM_SUGGESTIONS} onSelect={setDmMessage} />
              </div>

              {/* ── LINK URL + BUTTON LABEL ───────────────────────────── */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Link URL</label>
                <div className="relative">
                  <input value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    onBlur={() => { if (linkUrl && !linkUrl.startsWith("http://") && !linkUrl.startsWith("https://")) setLinkUrl("https://" + linkUrl); }}
                    placeholder="https://yoursite.com/offer"
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none pr-8"
                    style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                  {linkUrl.startsWith("http") && (
                    <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#059669" }} />
                  )}
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>The URL your follower will be sent to</p>
              </div>
              <div style={{ opacity: linkUrl ? 1 : 0.4, transition: "opacity 0.2s", pointerEvents: linkUrl ? "auto" : "none" }}>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Button Label</label>
                <input value={buttonText} onChange={e => setButtonText(e.target.value.slice(0, 25))}
                  placeholder="Get the link →"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                <div className="flex justify-between mt-1">
                  <p className="text-[10px]" style={{ color: "#A1A1AA" }}>Text on the clickable button in the DM</p>
                  <span className="text-[10px]" style={{ color: buttonText.length >= 25 ? "#DC2626" : "#A1A1AA" }}>{buttonText.length}/25</span>
                </div>
              </div>

              {/* ── DELIVERY MESSAGE + BUTTON ─────────────────────────── */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Delivery Message</label>
                <textarea value={deliveryMessage} onChange={e => setDeliveryMessage(e.target.value)} rows={2}
                  placeholder="Here's your link! Tap below to access it 🎁"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                <SuggestionChips suggestions={DELIVERY_SUGGESTIONS} onSelect={setDeliveryMessage} />
                <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>Sent after the user confirms. Leave blank to skip the confirmation step.</p>
              </div>
              <div style={{ opacity: deliveryMessage ? 1 : 0.4, transition: "opacity 0.2s", pointerEvents: deliveryMessage ? "auto" : "none" }}>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#A1A1AA" }}>Delivery Button Label</label>
                <input value={deliveryButtonText} onChange={e => setDeliveryButtonText(e.target.value.slice(0, 25))}
                  placeholder="Access now →"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                <div className="flex justify-end mt-1">
                  <span className="text-[10px]" style={{ color: deliveryButtonText.length >= 25 ? "#DC2626" : "#A1A1AA" }}>{deliveryButtonText.length}/25</span>
                </div>
              </div>

              {/* ── FOLLOW-UP QUESTION ────────────────────────────────── */}
              <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Follow-Up Question</label>
                  <EnableToggle enabled={followUpEnabled} onChange={setFollowUpEnabled} />
                </div>
                {followUpEnabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: "#A1A1AA" }}>Question</label>
                      <input value={followUpQuestion} onChange={e => setFollowUpQuestion(e.target.value)}
                        placeholder="What type of content are you interested in?"
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                        style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                      <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>Engagr will send this question after the initial DM is delivered.</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: "#A1A1AA" }}>Quick Reply Options</label>
                      <p className="text-[10px] mb-2" style={{ color: "#A1A1AA" }}>Users tap one of these to reply instantly.</p>
                      <div className="space-y-2">
                        {followUpOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input value={opt} onChange={e => { const next = [...followUpOptions]; next[idx] = e.target.value; setFollowUpOptions(next); }}
                              placeholder={`Option ${idx + 1}`}
                              className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
                              style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                            {followUpOptions.length > 2 && (
                              <button onClick={() => setFollowUpOptions(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1.5 rounded-md" style={{ color: "#A1A1AA" }}><Trash2 size={13} /></button>
                            )}
                          </div>
                        ))}
                        {followUpOptions.length < 4 && (
                          <button onClick={() => setFollowUpOptions(prev => [...prev, ""])}
                            className="flex items-center gap-1 text-xs font-medium pt-1" style={{ color: "#4F46E5" }}>
                            <Plus size={12} /> Add option
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: "#A1A1AA" }}>Auto-Response</label>
                      <textarea value={followUpResponse} onChange={e => setFollowUpResponse(e.target.value)} rows={2}
                        placeholder="Thanks for letting us know! We'll send you relevant content shortly."
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                        style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                      <p className="text-[10px] mt-1" style={{ color: "#A1A1AA" }}>Engagr sends this message regardless of which option the user picks.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── FOLLOWER GATE ─────────────────────────────────────── */}
              <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Follower Gate</label>
                  <EnableToggle enabled={followerGateEnabled} onChange={setFollowerGateEnabled} />
                </div>
                {followerGateEnabled && (
                  <input value={followerGateMessage} onChange={e => setFollowerGateMessage(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                    style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Review ───────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#18181B" }}>{name}</p>
                  <TypeBadge type={selectedType} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-medium uppercase" style={{ color: "#A1A1AA" }}>Scope</p>
                    <p style={{ color: "#52525B" }}>{scope === "post_specific" ? `Specific posts (${mediaIds.length})` : "All posts"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase" style={{ color: "#A1A1AA" }}>Keywords</p>
                    <p style={{ color: "#52525B" }}>{keywords.length > 0 ? keywords.join(", ") : "Any comment"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase" style={{ color: "#A1A1AA" }}>Comment Replies</p>
                    <p style={{ color: "#52525B" }}>{commentReplyEnabled ? `${replyMessages.filter(m => typeof m === "string" && m.trim()).length} variant(s)` : "Disabled"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase" style={{ color: "#A1A1AA" }}>Follower Gate</p>
                    <p style={{ color: "#52525B" }}>{followerGateEnabled ? "Required" : "Off"}</p>
                  </div>
                  {linkUrl && (
                    <div>
                      <p className="text-[10px] font-medium uppercase" style={{ color: "#A1A1AA" }}>Link</p>
                      <p className="truncate" style={{ color: "#52525B" }}>{linkUrl}</p>
                    </div>
                  )}
                  {followUpEnabled && (
                    <div>
                      <p className="text-[10px] font-medium uppercase" style={{ color: "#A1A1AA" }}>Follow-Up</p>
                      <p style={{ color: "#52525B" }}>{followUpOptions.filter(o => typeof o === "string" && o.trim()).length} options</p>
                    </div>
                  )}
                </div>
                {dmMessage && (
                  <div>
                    <p className="text-[10px] font-medium uppercase" style={{ color: "#A1A1AA" }}>DM Message</p>
                    <p className="text-sm mt-0.5" style={{ color: "#52525B" }}>{dmMessage}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid #F0F0F0" }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "#71717A" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F4F5"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            {step > 1 ? <><ArrowLeft size={14} /> Back</> : "Cancel"}
          </button>

          {step < 3 ? (
            <button onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep2 : !canProceedStep3}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: "#4F46E5" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}>
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#4F46E5" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}>
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {creating ? "Creating..." : "Create Automation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete confirmation ────────────────────────────────────────────────────

function DeleteDialog({ automation, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-xl" style={{ backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold" style={{ color: "#18181B" }}>Delete Automation?</h3>
        <p className="text-sm" style={{ color: "#71717A" }}>
          Delete <strong>&ldquo;{automation.name}&rdquo;</strong>? All settings will be lost. Activity history will be preserved.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: "#71717A", backgroundColor: "#F4F4F5" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#DC2626" }}>
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AutomationList() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState(null);
  const [username, setUsername] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [builderMode, setBuilderMode] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getInstagramAccount();
        if (data?.isConnected && data.accountId) {
          setAccountId(data.accountId);
          setUsername(data.username || "");
          const res = await getAutomationsAction(data.accountId);
          if (res.success) setAutomations(res.automations);
        }
      } catch (e) {
        console.error("Failed to load automations:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = useCallback(async (id, enabled) => {
    setTogglingId(id);
    try {
      const res = await toggleAutomationAction(id, enabled);
      if (res.success) {
        setAutomations(prev => prev.map(a => a._id === id ? { ...a, enabled } : a));
        toast.success(enabled ? "Automation enabled" : "Automation paused");
      } else {
        toast.error(res.error || "Failed to toggle");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTogglingId(null);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteAutomationAction(deleteTarget._id);
      if (res.success) {
        setAutomations(prev => prev.filter(a => a._id !== deleteTarget._id));
        toast.success("Automation deleted");
        setDeleteTarget(null);
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const handleDuplicate = useCallback(async (automation) => {
    if (!accountId) return;
    try {
      const res = await createAutomationAction(accountId, {
        name: `${automation.name} (copy)`,
        type: automation.type,
        scope: automation.scope,
        mediaIds: automation.mediaIds || [],
        keywords: automation.keywords || [],
        commentReply: automation.commentReply,
        dmMessage: automation.dmMessage,
        linkUrl: automation.linkUrl || "",
        buttonText: automation.buttonText || "",
        deliveryMessage: automation.deliveryMessage || "",
        deliveryButtonText: automation.deliveryButtonText || "",
        followUp: automation.followUp,
        followerGate: automation.followerGate,
        enabled: false,
      });
      if (res.success) {
        setAutomations(prev => [res.automation, ...prev]);
        toast.success("Automation duplicated");
      } else {
        toast.error(res.error || "Failed to duplicate");
      }
    } catch (e) {
      toast.error(e.message);
    }
  }, [accountId]);

  const handleCreated = useCallback((automation) => {
    setAutomations(prev => [automation, ...prev]);
  }, []);

  const openBuilder = useCallback((auto = null) => {
    setEditingAutomation(auto);
    setBuilderMode(true);
  }, []);

  const closeBuilder = useCallback(() => {
    setBuilderMode(false);
    setEditingAutomation(null);
  }, []);

  const handleBuilderSave = useCallback((saved) => {
    if (editingAutomation) {
      setAutomations(prev => prev.map(a => a._id === saved._id ? saved : a));
    } else {
      setAutomations(prev => [saved, ...prev]);
    }
    closeBuilder();
  }, [editingAutomation, closeBuilder]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-40 rounded-lg animate-pulse" style={{ backgroundColor: "#F4F4F5" }} />
            <div className="h-4 w-64 rounded-lg mt-2 animate-pulse" style={{ backgroundColor: "#F4F4F5" }} />
          </div>
          <div className="h-10 w-36 rounded-lg animate-pulse" style={{ backgroundColor: "#F4F4F5" }} />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0F0F0" }}>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-32 rounded" style={{ backgroundColor: "#F4F4F5" }} />
                    <div className="h-5 w-24 rounded-full" style={{ backgroundColor: "#F4F4F5" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-16 rounded" style={{ backgroundColor: "#F4F4F5" }} />
                    <div className="h-3 w-12 rounded" style={{ backgroundColor: "#F4F4F5" }} />
                    <div className="h-3 w-12 rounded" style={{ backgroundColor: "#F4F4F5" }} />
                  </div>
                </div>
                <div className="hidden md:flex gap-6">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="space-y-1 text-center">
                      <div className="h-4 w-8 mx-auto rounded" style={{ backgroundColor: "#F4F4F5" }} />
                      <div className="h-2.5 w-10 mx-auto rounded" style={{ backgroundColor: "#F4F4F5" }} />
                    </div>
                  ))}
                </div>
                <div className="h-5 w-10 rounded-full" style={{ backgroundColor: "#F4F4F5" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Builder mode ──────────────────────────────────────────────────────
  if (builderMode && accountId) {
    return (
      <AutomationBuilder
        accountId={accountId}
        username={username}
        automation={editingAutomation}
        onSave={handleBuilderSave}
        onBack={closeBuilder}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#18181B" }}>Automations</h1>
          <p className="text-sm" style={{ color: "#71717A" }}>Manage your comment-to-DM, reel share, and mention reply automations</p>
        </div>
        {automations.length > 0 && (
          <button onClick={() => openBuilder()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#4F46E5" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}>
            <Plus size={16} /> Add Automation
          </button>
        )}
      </div>

      {/* List or empty state */}
      {automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0F0F0" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#EEF2FF" }}>
            <Zap size={28} style={{ color: "#4F46E5" }} />
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: "#18181B" }}>No automations yet</h3>
          <p className="text-sm max-w-sm mb-6" style={{ color: "#71717A" }}>
            Create your first automation to start engaging with your audience automatically
          </p>
          <button onClick={() => openBuilder()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#4F46E5" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}>
            <Plus size={16} /> Create Automation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(a => (
            <AutomationCard key={a._id} automation={a}
              expandedId={expandedId} onExpand={setExpandedId}
              onToggle={handleToggle} togglingId={togglingId}
              onDuplicate={handleDuplicate}
              onDelete={setDeleteTarget}
              onEdit={openBuilder}
              accountId={accountId}
              onAutomationUpdated={(updated) => setAutomations(prev => prev.map(x => x._id === updated._id ? updated : x))} />
          ))}
        </div>
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteDialog automation={deleteTarget} deleting={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
