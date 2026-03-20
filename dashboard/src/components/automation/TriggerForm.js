"use client";

import { cn } from "@/lib/utils";
import { Toggle } from "./UIHelpers";
import { Play, ExternalLink, Heart, MessageCircle, CheckCircle2 } from "lucide-react";

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
          <div className="space-y-2 mt-4">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Reply messages — one is picked at random
            </p>
            {replyMessages.map((text, i) => (
              <input
                key={i}
                type="text"
                value={text}
                onChange={(e) => {
                  const updated = [...replyMessages];
                  updated[i] = e.target.value;
                  setReplyMessages(updated);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl h-10 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
