"use client";
import React from "react";
import { Heart, MessageCircle, Send, Bookmark, Home, Search, PlusSquare, Play, User } from "lucide-react";

// ── Instagram-style phone mockup ──────────────────────────────────────────
export default function PhonePreview({ activeStep, username, selectedPost, dmMessage, linkUrl, buttonText, replyMessages }) {
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "#A1A1AA" }}>Preview Automation</p>
      {/* Phone frame */}
      <div className="rounded-[2.5rem] overflow-hidden shadow-xl" style={{ backgroundColor: "#000", padding: "10px", border: "3px solid #1a1a1a" }}>
        {/* Notch */}
        <div className="flex justify-center pt-1 pb-2">
          <div className="w-24 h-5 rounded-full" style={{ backgroundColor: "#1a1a1a" }} />
        </div>
        {/* Screen */}
        <div className="rounded-[2rem] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 py-1.5" style={{ backgroundColor: "#FAFAFA" }}>
            <span className="text-[9px] font-semibold" style={{ color: "#18181B" }}>9:41</span>
            <div className="flex gap-1">
              <div className="w-3.5 h-2 rounded-sm" style={{ backgroundColor: "#18181B" }} />
              <div className="w-3.5 h-2 rounded-sm" style={{ backgroundColor: "#18181B" }} />
            </div>
          </div>

          {/* Content area */}
          <div style={{ minHeight: 420 }}>
            {activeStep === 1 && <PostPreview username={username} post={selectedPost} />}
            {activeStep === 3 && <DmPreview username={username} message={dmMessage} linkUrl={linkUrl} buttonText={buttonText} />}
            {activeStep === "replies" && <ReplyPreview username={username} replies={replyMessages} />}
            {activeStep !== 1 && activeStep !== 3 && activeStep !== "replies" && (
              <PostPreview username={username} post={selectedPost} />
            )}
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-around py-2 px-4" style={{ borderTop: "1px solid #F0F0F0" }}>
            <Home size={18} style={{ color: "#18181B" }} />
            <Search size={18} style={{ color: "#A1A1AA" }} />
            <PlusSquare size={18} style={{ color: "#A1A1AA" }} />
            <Play size={18} style={{ color: "#A1A1AA" }} />
            <User size={18} style={{ color: "#A1A1AA" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PostPreview({ username, post }) {
  const thumb = post?.media_type === "VIDEO" ? post?.thumbnail_url : post?.media_url;
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-7 h-7 rounded-full" style={{ backgroundColor: "#EEF2FF", border: "2px solid #4F46E5" }} />
        <span className="text-[11px] font-semibold" style={{ color: "#18181B" }}>{username || "youraccount"}</span>
      </div>
      {/* Image */}
      <div className="aspect-square w-full" style={{ backgroundColor: "#F4F4F5" }}>
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-[10px] text-center px-6 leading-relaxed" style={{ color: "#A1A1AA" }}>
              You haven&apos;t picked a post or reel for your automation yet
            </p>
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Heart size={18} style={{ color: "#18181B" }} />
          <MessageCircle size={18} style={{ color: "#18181B" }} />
          <Send size={18} style={{ color: "#18181B" }} />
        </div>
        <Bookmark size={18} style={{ color: "#18181B" }} />
      </div>
      {/* Caption */}
      {post?.caption && (
        <div className="px-3 pb-2">
          <p className="text-[10px] leading-relaxed" style={{ color: "#18181B" }}>
            <span className="font-semibold">{username} </span>
            {post.caption.length > 60 ? post.caption.slice(0, 60) + "..." : post.caption}
          </p>
        </div>
      )}
      <div className="px-3 pb-2">
        <p className="text-[9px]" style={{ color: "#A1A1AA" }}>View all comments</p>
      </div>
    </div>
  );
}

function DmPreview({ username, message, linkUrl, buttonText }) {
  return (
    <div className="px-3 py-3 space-y-3">
      {/* DM header */}
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid #F0F0F0" }}>
        <div className="w-7 h-7 rounded-full" style={{ backgroundColor: "#EEF2FF", border: "2px solid #4F46E5" }} />
        <div>
          <span className="text-[11px] font-semibold" style={{ color: "#18181B" }}>{username || "youraccount"}</span>
          <p className="text-[8px]" style={{ color: "#A1A1AA" }}>Active now</p>
        </div>
      </div>
      {/* Message bubble */}
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-md px-3 py-2" style={{ backgroundColor: "#F0F0F0" }}>
          <p className="text-[11px] leading-relaxed" style={{ color: "#18181B" }}>
            {message || "Your DM message will appear here..."}
          </p>
          {linkUrl && (
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid #E4E4E7" }}>
              <p className="text-[10px] font-semibold text-center rounded-lg py-1.5" style={{ color: "#4F46E5" }}>
                {buttonText || "Get the link →"}
              </p>
            </div>
          )}
        </div>
      </div>
      {!message && (
        <p className="text-[9px] text-center pt-4" style={{ color: "#A1A1AA" }}>
          Start typing a DM message to see the preview
        </p>
      )}
    </div>
  );
}

function ReplyPreview({ username, replies }) {
  const validReplies = (replies || []).filter(r => r?.trim());
  return (
    <div className="px-3 py-3 space-y-2">
      {/* Comment header */}
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid #F0F0F0" }}>
        <span className="text-[11px] font-semibold" style={{ color: "#18181B" }}>Comments</span>
      </div>
      {/* Fake user comment */}
      <div className="flex gap-2 items-start">
        <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: "#F4F4F5" }} />
        <div>
          <p className="text-[10px]" style={{ color: "#18181B" }}>
            <span className="font-semibold">user123 </span>How do I get this?
          </p>
        </div>
      </div>
      {/* Bot reply */}
      {validReplies.length > 0 ? validReplies.map((r, i) => (
        <div key={i} className="flex gap-2 items-start pl-4">
          <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: "#EEF2FF", border: "1px solid #4F46E5" }} />
          <div>
            <p className="text-[10px]" style={{ color: "#18181B" }}>
              <span className="font-semibold">{username || "youraccount"} </span>{r}
            </p>
            <p className="text-[8px] mt-0.5" style={{ color: "#A1A1AA" }}>Variant {i + 1}</p>
          </div>
        </div>
      )) : (
        <p className="text-[9px] text-center pt-4" style={{ color: "#A1A1AA" }}>
          Add public reply variants to see the preview
        </p>
      )}
    </div>
  );
}
