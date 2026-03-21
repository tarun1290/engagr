"use client";

import { cn } from "@/lib/utils";
import { Toggle } from "./UIHelpers";
import { Play, ExternalLink, Heart, MessageCircle, CheckCircle2, UserCheck } from "lucide-react";

const REPLY_PRESETS = [
  "Check your DMs! 📩",
  "I just sent you a message! 📬",
  "Look in your inbox 👀",
  "Replied! Check your DMs 💬",
  "Just DM'd you! ✉️",
  "I got you! Check your messages 🙌",
  "Sent! See you in DMs 🚀",
  "Your message is waiting 📥",
];

const RadioOption = ({ selected, onClick, label }) => (
  <div onClick={onClick} className="flex items-center gap-3 cursor-pointer group select-none">
    <div
      className={cn(
        "w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
      )}
      style={
        selected
          ? { borderColor: 'var(--primary)', backgroundColor: 'var(--primary)' }
          : { borderColor: 'var(--text-placeholder)' }
      }
    >
      {selected && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
    </div>
    <span className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
  </div>
);

function MediaGrid({ media, selectedPost, setSelectedPost }) {
  if (!media?.length) {
    return (
      <p className="text-xs italic py-2" style={{ color: 'var(--text-placeholder)' }}>
        No recent posts found. Make sure your account has public posts.
      </p>
    );
  }

  const selected = media.find(p => p.id === selectedPost);

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {media.map((p) => {
          const isVideo = p.media_type === "VIDEO";
          const thumb = isVideo ? p.thumbnail_url : p.media_url;
          const isSelected = selectedPost === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedPost(p.id)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all group",
                isSelected
                  ? "ring-2 ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              )}
              style={{
                backgroundColor: 'var(--surface-alt)',
                ...(isSelected ? { '--tw-ring-color': 'var(--primary)' } : {})
              }}
            >
              {thumb ? (
                <img src={thumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-alt)' }}>
                  <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-placeholder)' }}>No Preview</span>
                </div>
              )}

              {/* Reel indicator */}
              {isVideo && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                  <Play size={9} className="text-white fill-white ml-0.5" />
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-1.5 left-1.5">
                  <CheckCircle2 size={18} className="fill-white drop-shadow" style={{ color: 'var(--primary)' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected post detail */}
      {selected && (
        <div
          className="rounded-2xl p-4 flex gap-4 animate-in fade-in duration-200"
          style={{ backgroundColor: 'var(--surface-alt)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--surface-alt)' }}>
            {(selected.media_type === "VIDEO" ? selected.thumbnail_url : selected.media_url) ? (
              <img
                src={selected.media_type === "VIDEO" ? selected.thumbnail_url : selected.media_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={
                  selected.media_type === "VIDEO"
                    ? { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-medium)' }
                    : { backgroundColor: 'var(--info-light)', color: 'var(--info)', border: '1px solid var(--info-light)' }
                }
              >
                {selected.media_type === "VIDEO" ? "Reel / Video" : "Photo"}
              </span>
            </div>
            {selected.caption ? (
              <p className="text-[12px] leading-snug line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{selected.caption}</p>
            ) : (
              <p className="text-[12px] italic" style={{ color: 'var(--text-placeholder)' }}>No caption</p>
            )}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--text-placeholder)' }}>
                <Heart size={11} /> {(selected.like_count || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--text-placeholder)' }}>
                <MessageCircle size={11} /> {(selected.comments_count || 0).toLocaleString()}
              </span>
              {selected.permalink && (
                <a
                  href={selected.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold hover:underline ml-auto"
                  style={{ color: 'var(--primary)' }}
                >
                  View <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TriggerForm({
  postTrigger, setPostTrigger,
  commentTrigger, setCommentTrigger,
  selectedPost, setSelectedPost,
  keywords, setKeywords,
  replyToggle, setReplyToggle,
  replyMessages, setReplyMessages,
  requireFollow, setRequireFollow,
  followPromptPublicReply, setFollowPromptPublicReply,
  followPromptDM, setFollowPromptDM,
  followButtonText, setFollowButtonText,
  instagramUsername = "",
  media = []
}) {
  return (
    <div className="space-y-10 theme-transition">

      {/* ── Section 1: Which post/reel ── */}
      <div>
        <h2 className="text-[15px] font-black uppercase tracking-widest mb-5" style={{ color: 'var(--text-primary)' }}>
          Trigger on
        </h2>
        <div className="space-y-3">
          <RadioOption
            selected={postTrigger === "specific"}
            onClick={() => setPostTrigger("specific")}
            label="A specific post or reel"
          />
          {postTrigger === "specific" && (
            <div className="ml-7 pt-1">
              <MediaGrid media={media} selectedPost={selectedPost} setSelectedPost={setSelectedPost} />
            </div>
          )}

          <RadioOption
            selected={postTrigger === "any"}
            onClick={() => setPostTrigger("any")}
            label="Any post or reel"
          />
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

      {/* ── Section 2: Comment trigger ── */}
      <div>
        <h2 className="text-[15px] font-black uppercase tracking-widest mb-5" style={{ color: 'var(--text-primary)' }}>
          When the comment has
        </h2>
        <div className="space-y-3">
          <RadioOption
            selected={commentTrigger === "specific"}
            onClick={() => setCommentTrigger("specific")}
            label="A specific word or phrase"
          />
          {commentTrigger === "specific" && (
            <div className="ml-7 space-y-3 pt-1">
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. price, link, details (comma-separated)"
                className="w-full rounded-xl h-11 px-4 text-sm outline-none transition-all"
                style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-placeholder)' }}>Quick add:</span>
                {["Price", "Link", "Shop", "Details", "Info"].map(word => (
                  <button
                    key={word}
                    onClick={() => setKeywords(prev => prev ? `${prev}, ${word}` : word)}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg transition-colors"
                    style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--primary-medium)' }}
                  >
                    + {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          <RadioOption
            selected={commentTrigger === "any"}
            onClick={() => setCommentTrigger("any")}
            label="Any word (reply to all comments)"
          />
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

      {/* ── Section 3: Public comment reply toggle ── */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
              Public reply to comment
            </h2>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--text-placeholder)' }}>
              Bot replies publicly on the post before sending a DM
            </p>
          </div>
          <Toggle on={replyToggle} onClick={() => setReplyToggle(!replyToggle)} />
        </div>

        {replyToggle && (
          <div className="space-y-4 mt-4">
            {/* Presets — single select */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-placeholder)' }}>
                Presets — select one
              </p>
              <div className="flex flex-wrap gap-2">
                {REPLY_PRESETS.map((preset) => {
                  const isSelected = replyMessages[0] === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => setReplyMessages([preset])}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                      style={
                        isSelected
                          ? { backgroundColor: 'var(--primary-light)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--primary-medium)', color: 'var(--primary)' }
                          : { backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                      }
                    >
                      {isSelected && "✓ "}{preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Single reply input */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-placeholder)' }}>
                Reply message
              </p>
              <input
                type="text"
                value={replyMessages[0] || ""}
                onChange={(e) => setReplyMessages([e.target.value])}
                placeholder="Type your public reply here…"
                className="w-full rounded-xl h-10 px-4 text-sm outline-none transition-all"
                style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

      {/* ── Section 4: Follow gate ── */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck size={15} style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-[15px] font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                Followers only
              </h2>
            </div>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--text-placeholder)' }}>
              Only send the automation DM to people who already follow you
            </p>
          </div>
          <Toggle on={requireFollow} onClick={() => setRequireFollow(!requireFollow)} />
        </div>

        {requireFollow && (
          <div
            className="space-y-5 mt-5 rounded-2xl p-5"
            style={{ backgroundColor: 'var(--surface-alt)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
          >
            <div className="flex items-start gap-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--warning-light)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--warning-light)' }}
              >
                <UserCheck size={14} style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <p className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>How this works</p>
                <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'var(--text-placeholder)' }}>
                  When a non-follower comments, the bot publicly replies and sends them a DM asking them to follow first. Once they follow and comment again, they receive the automation message normally.
                </p>
                <p className="text-[11px] font-medium mt-1.5" style={{ color: 'var(--warning-dark)' }}>
                  Checks up to ~2,000 followers. Works best for accounts under 10k followers.
                </p>
              </div>
            </div>

            {/* Non-follower public reply */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>
                Public reply for non-followers
              </label>
              <p className="text-[11px]" style={{ color: 'var(--text-placeholder)' }}>Visible on the post to everyone.</p>
              <input
                type="text"
                value={followPromptPublicReply}
                onChange={(e) => setFollowPromptPublicReply(e.target.value)}
                placeholder={instagramUsername
                  ? `Follow @${instagramUsername} and comment again to get my message! 💌`
                  : "Follow us and comment again to get my message! 💌"}
                className="w-full rounded-xl h-10 px-4 text-sm outline-none transition-all"
                style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  `Follow @${instagramUsername || "us"} first to get my message! 💌`,
                  `Hit follow then comment again and I'll DM you! 👆`,
                  `Follow our page and I'll send it right over! 🚀`,
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setFollowPromptPublicReply(preset)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                    style={{ backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-medium)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Non-follower DM */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>
                DM sent to non-followers
              </label>
              <p className="text-[11px]" style={{ color: 'var(--text-placeholder)' }}>Sent as the first message. The confirm button is automatically added below it.</p>
              <textarea
                value={followPromptDM}
                onChange={(e) => setFollowPromptDM(e.target.value)}
                placeholder={instagramUsername
                  ? `Hey! 👋 Follow @${instagramUsername} to receive my message 💌\n\nhttps://instagram.com/${instagramUsername}`
                  : "Hey! 👋 Follow our account to receive my message 💌"}
                rows={4}
                className="w-full rounded-xl p-4 text-sm outline-none transition-all resize-none leading-relaxed"
                style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { label: "Friendly", text: instagramUsername ? `Hey! 👋 Follow @${instagramUsername} to receive my message 💌\n\nhttps://instagram.com/${instagramUsername}` : "Hey! 👋 Follow our account to receive my message 💌" },
                  { label: "Short", text: instagramUsername ? `Follow @${instagramUsername} to get what you're looking for! 🙌\n\nhttps://instagram.com/${instagramUsername}` : "Follow our page to receive the message! 🙌" },
                  { label: "Warm", text: instagramUsername ? `Hey! 💕 I'd love to send this to you!\n\nFollow @${instagramUsername} and confirm below ✨\n\nhttps://instagram.com/${instagramUsername}` : "Hey! 💕 Follow us and confirm below to get my message ✨" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setFollowPromptDM(preset.text)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                    style={{ backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-medium)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm button label */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>
                Confirm button label
              </label>
              <p className="text-[11px]" style={{ color: 'var(--text-placeholder)' }}>
                The button text the user taps to confirm they've followed. Max 20 characters.
              </p>
              <input
                type="text"
                maxLength={20}
                value={followButtonText}
                onChange={(e) => setFollowButtonText(e.target.value)}
                placeholder="I'm following now! ✓"
                className="w-full rounded-xl h-10 px-4 text-sm outline-none transition-all"
                style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {["I'm following now! ✓", "Done! I followed ✓", "Following! Send it 🚀", "Followed! Confirm ✅"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setFollowButtonText(preset)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                    style={
                      followButtonText === preset
                        ? { backgroundColor: 'var(--primary-light)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--primary-medium)', color: 'var(--primary)' }
                        : { backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-muted)' }
                    }
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div
                className="mt-3 rounded-2xl p-4 space-y-2"
                style={{ backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
              >
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Preview</p>
                <p className="text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>Once you've followed, tap the button below to confirm! 👇</p>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--primary-light)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--primary-medium)' }}
                >
                  <span className="text-[13px] font-bold" style={{ color: 'var(--primary)' }}>{followButtonText || "I'm following now! ✓"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
