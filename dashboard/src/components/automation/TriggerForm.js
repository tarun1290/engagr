"use client";

import { cn } from "@/lib/utils";
import { Toggle } from "./UIHelpers";
import { Play, ExternalLink, Heart, MessageCircle, CheckCircle2, X, Plus, UserCheck } from "lucide-react";

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
    <div className={cn(
      "w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
      selected ? "border-primary bg-primary" : "border-slate-300 group-hover:border-slate-400"
    )}>
      {selected && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
    </div>
    <span className="text-[14px] text-slate-700 font-medium">{label}</span>
  </div>
);

function MediaGrid({ media, selectedPost, setSelectedPost }) {
  if (!media?.length) {
    return (
      <p className="text-xs text-slate-400 italic py-2">
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
                "relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all bg-slate-100 group",
                isSelected
                  ? "ring-2 ring-primary ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              {thumb ? (
                <img src={thumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">No Preview</span>
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
                  <CheckCircle2 size={18} className="text-primary fill-white drop-shadow" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected post detail */}
      {selected && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">
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
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                selected.media_type === "VIDEO"
                  ? "bg-purple-50 text-purple-600 border border-purple-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              )}>
                {selected.media_type === "VIDEO" ? "Reel / Video" : "Photo"}
              </span>
            </div>
            {selected.caption ? (
              <p className="text-[12px] text-slate-600 leading-snug line-clamp-2">{selected.caption}</p>
            ) : (
              <p className="text-[12px] text-slate-400 italic">No caption</p>
            )}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Heart size={11} /> {(selected.like_count || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <MessageCircle size={11} /> {(selected.comments_count || 0).toLocaleString()}
              </span>
              {selected.permalink && (
                <a
                  href={selected.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline ml-auto"
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
    <div className="space-y-10">

      {/* ── Section 1: Which post/reel ── */}
      <div>
        <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-widest mb-5">
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

      <div className="h-px bg-slate-100" />

      {/* ── Section 2: Comment trigger ── */}
      <div>
        <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-widest mb-5">
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
                className="w-full bg-white border border-slate-200 rounded-xl h-11 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Quick add:</span>
                {["Price", "Link", "Shop", "Details", "Info"].map(word => (
                  <button
                    key={word}
                    onClick={() => setKeywords(prev => prev ? `${prev}, ${word}` : word)}
                    className="text-[11px] font-bold text-primary bg-pink-50 border border-pink-100 px-2 py-1 rounded-lg hover:bg-pink-100 transition-colors"
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

      <div className="h-px bg-slate-100" />

      {/* ── Section 3: Public comment reply toggle ── */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-widest">
              Public reply to comment
            </h2>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">
              Bot replies publicly on the post before sending a DM
            </p>
          </div>
          <Toggle on={replyToggle} onClick={() => setReplyToggle(!replyToggle)} />
        </div>

        {replyToggle && (
          <div className="space-y-5 mt-4">
            {/* Presets */}
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                Quick presets — click to add
              </p>
              <div className="flex flex-wrap gap-2">
                {REPLY_PRESETS.map((preset) => {
                  const isAdded = replyMessages.includes(preset);
                  return (
                    <button
                      key={preset}
                      onClick={() => {
                        if (isAdded) {
                          setReplyMessages(replyMessages.filter(m => m !== preset));
                        } else {
                          setReplyMessages([...replyMessages, preset]);
                        }
                      }}
                      className={cn(
                        "text-[12px] font-semibold px-3 py-1.5 rounded-xl border transition-all",
                        isAdded
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-white border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
                      )}
                    >
                      {isAdded ? "✓ " : "+ "}{preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active messages */}
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                Active messages — one is picked at random
              </p>
              <div className="space-y-2">
                {replyMessages.map((text, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => {
                        const updated = [...replyMessages];
                        updated[i] = e.target.value;
                        setReplyMessages(updated);
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-xl h-10 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    />
                    {replyMessages.length > 1 && (
                      <button
                        onClick={() => setReplyMessages(replyMessages.filter((_, idx) => idx !== i))}
                        className="w-10 h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setReplyMessages([...replyMessages, ""])}
                className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-primary mt-3 transition-colors"
              >
                <Plus size={13} /> Add custom reply
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* ── Section 4: Follow gate ── */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck size={15} className="text-slate-500" />
              <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-widest">
                Followers only
              </h2>
            </div>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">
              Only send the automation DM to people who already follow you
            </p>
          </div>
          <Toggle on={requireFollow} onClick={() => setRequireFollow(!requireFollow)} />
        </div>

        {requireFollow && (
          <div className="space-y-5 mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserCheck size={14} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-700">How this works</p>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  When a non-follower comments, the bot publicly replies and sends them a DM asking them to follow first. Once they follow and comment again, they receive the automation message normally.
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-1.5">
                  Checks up to ~2,000 followers. Works best for accounts under 10k followers.
                </p>
              </div>
            </div>

            {/* Non-follower public reply */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Public reply for non-followers
              </label>
              <p className="text-[11px] text-slate-400">Visible on the post to everyone.</p>
              <input
                type="text"
                value={followPromptPublicReply}
                onChange={(e) => setFollowPromptPublicReply(e.target.value)}
                placeholder={instagramUsername
                  ? `Follow @${instagramUsername} and comment again to get my message! 💌`
                  : "Follow us and comment again to get my message! 💌"}
                className="w-full bg-white border border-slate-200 rounded-xl h-10 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
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
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border bg-white border-slate-200 text-slate-500 hover:border-primary/30 hover:text-primary transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Non-follower DM */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                DM sent to non-followers
              </label>
              <p className="text-[11px] text-slate-400">Sent as the first message. The confirm button is automatically added below it.</p>
              <textarea
                value={followPromptDM}
                onChange={(e) => setFollowPromptDM(e.target.value)}
                placeholder={instagramUsername
                  ? `Hey! 👋 Follow @${instagramUsername} to receive my message 💌\n\nhttps://instagram.com/${instagramUsername}`
                  : "Hey! 👋 Follow our account to receive my message 💌"}
                rows={4}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none leading-relaxed"
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
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-white border-slate-200 text-slate-500 hover:border-primary/30 hover:text-primary transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm button label */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Confirm button label
              </label>
              <p className="text-[11px] text-slate-400">
                The button text the user taps to confirm they've followed. Max 20 characters.
              </p>
              <input
                type="text"
                maxLength={20}
                value={followButtonText}
                onChange={(e) => setFollowButtonText(e.target.value)}
                placeholder="I'm following now! ✓"
                className="w-full bg-white border border-slate-200 rounded-xl h-10 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {["I'm following now! ✓", "Done! I followed ✓", "Following! Send it 🚀", "Followed! Confirm ✅"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setFollowButtonText(preset)}
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all",
                      followButtonText === preset
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-white border-slate-200 text-slate-500 hover:border-primary/30 hover:text-primary"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-3 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Preview</p>
                <p className="text-[13px] text-slate-600 leading-snug">Once you've followed, tap the button below to confirm! 👇</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-[13px] font-bold text-primary">{followButtonText || "I'm following now! ✓"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
