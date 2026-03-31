"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2, Plus, X, Trash2, Check, ImageIcon, Link2, ChevronDown, Info,
  ToggleLeft, ToggleRight, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAutomationAction,
  updateAutomationAction,
} from "@/app/dashboard/automation-actions";
import { getAccountMediaAction } from "@/app/dashboard/comment-actions";
import PhonePreview from "./PhonePreview";

// ── Step badge ─────────────────────────────────────────────────────────────
function StepBadge({ n }) {
  return (
    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: "#4F46E5" }}>{n}</span>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange, label }) {
  return (
    <button onClick={() => onChange(!enabled)} className="flex items-center gap-2">
      {enabled
        ? <ToggleRight size={20} style={{ color: "#059669" }} />
        : <ToggleLeft size={20} style={{ color: "#A1A1AA" }} />
      }
      {label && <span className="text-sm" style={{ color: enabled ? "#059669" : "#71717A" }}>{label}</span>}
    </button>
  );
}

// ── Main Builder ───────────────────────────────────────────────────────────
export default function AutomationBuilder({ accountId, username, automation, onSave, onBack }) {
  const isEditing = !!automation;

  // ── State ────────────────────────────────────────────────────────────────
  const [name, setName] = useState(automation?.name || "");
  const [scope, setScope] = useState(automation?.scope || "account_wide");
  const [mediaIds, setMediaIds] = useState(automation?.mediaIds || []);
  const [keywords, setKeywords] = useState(automation?.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [anyKeyword, setAnyKeyword] = useState(!automation?.keywords?.length);
  const [dmMessage, setDmMessage] = useState(automation?.dmMessage || "");
  const [linkUrl, setLinkUrl] = useState(automation?.linkUrl || "");
  const [buttonText, setButtonText] = useState(automation?.buttonText || "Get the link \u2192");
  const [showLink, setShowLink] = useState(!!(automation?.linkUrl));
  const [openingEnabled, setOpeningEnabled] = useState(!!(automation?.deliveryMessage));
  const [deliveryMessage, setDeliveryMessage] = useState(automation?.deliveryMessage || "");
  const [deliveryButtonText, setDeliveryButtonText] = useState(automation?.deliveryButtonText || "");
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(automation?.commentReply?.enabled ?? false);
  const [replyMessages, setReplyMessages] = useState(() => {
    const msgs = automation?.commentReply?.messages;
    return msgs?.length ? [...msgs] : ["Check your DMs! \ud83d\udce9"];
  });
  const [limitReplies, setLimitReplies] = useState(false);
  const [followerGateEnabled, setFollowerGateEnabled] = useState(automation?.followerGate?.enabled ?? false);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Media posts
  const [media, setMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [showMoreMedia, setShowMoreMedia] = useState(false);

  const [mediaLoaded, setMediaLoaded] = useState(false);
  useEffect(() => {
    if (mediaLoaded) return;
    setLoadingMedia(true);
    setMediaLoaded(true);
    getAccountMediaAction(accountId).then(res => {
      if (res.success) setMedia(res.media || []);
    }).catch(() => {}).finally(() => setLoadingMedia(false));
  }, [accountId, mediaLoaded]);

  const selectedPost = media.find(p => mediaIds.includes(p.id)) || null;

  // ── Keyword helpers ──────────────────────────────────────────────────────
  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !keywords.includes(k)) setKeywords(prev => [...prev, k]);
    setKeywordInput("");
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const stepRefs = { 1: null, 2: null, 3: null };

  const handleSave = async (goLive = false) => {
    if (!name.trim()) { toast.error("Please enter an automation name"); return; }
    if (goLive) {
      if (!dmMessage.trim()) {
        toast.error("Please enter a DM message (Step 3)");
        setActiveStep(3);
        return;
      }
      if (!anyKeyword && keywords.length === 0) {
        toast.error("Please add keywords or enable 'Any keyword' (Step 2)");
        setActiveStep(2);
        return;
      }
      if (scope === "post_specific" && mediaIds.length === 0) {
        toast.error("Please select at least one post (Step 1)");
        setActiveStep(1);
        return;
      }
    }
    setSaving(true);
    try {
      const safeMessages = (Array.isArray(replyMessages) ? replyMessages : []).filter(m => typeof m === "string" && m.trim());

      const payload = {
        name: name || "Untitled Automation",
        type: "comment_to_dm",
        scope,
        mediaIds: scope === "post_specific" ? mediaIds : [],
        keywords: anyKeyword ? [] : keywords,
        commentReply: {
          enabled: commentReplyEnabled,
          messages: safeMessages.length > 0 ? safeMessages : ["Check your DMs! \ud83d\udce9"],
        },
        dmMessage,
        linkUrl: showLink ? linkUrl : "",
        buttonText: showLink ? buttonText : "",
        deliveryMessage: openingEnabled ? deliveryMessage : "",
        deliveryButtonText: openingEnabled ? deliveryButtonText : "",
        followUp: { enabled: false, question: "", options: [], response: "" },
        followerGate: {
          enabled: followerGateEnabled,
          nonFollowerMessage: "Follow us first to get access!",
        },
        enabled: goLive ? true : (automation?.enabled ?? false),
      };

      let res;
      if (isEditing) {
        res = await updateAutomationAction(automation._id, payload);
      } else {
        res = await createAutomationAction(accountId, payload);
      }

      if (res && res.success) {
        toast.success(goLive ? "Automation is live!" : (isEditing ? "Automation saved!" : "Automation created!"));
        onSave(res.automation);
      } else {
        toast.error(res?.error || "Failed to save");
      }
    } catch (e) {
      console.error("[AutomationBuilder] Save error:", e);
      toast.error(e?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ── Visible media ────────────────────────────────────────────────────────
  const visibleMedia = showMoreMedia ? media : media.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg transition-colors"
            style={{ color: "#71717A" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F4F5"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>Editor</span>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Automation name..."
                className="text-lg font-bold outline-none bg-transparent" style={{ color: "#18181B", minWidth: 200 }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "#71717A", border: "1px solid #E4E4E7" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#FAFAFA"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Draft"}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#4F46E5" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Go Live
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left: Phone preview (sticky) */}
        <div className="hidden lg:block w-[340px] flex-shrink-0 sticky top-4">
          <PhonePreview
            activeStep={activeStep}
            username={username}
            selectedPost={selectedPost}
            dmMessage={dmMessage}
            linkUrl={showLink ? linkUrl : ""}
            buttonText={buttonText}
            replyMessages={replyMessages}
          />
        </div>

        {/* Right: Configuration */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* ── STEP 1: Select a Post or Reel ───────────────────── */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "#FFFFFF", border: activeStep === 1 ? "1px solid #C7D2FE" : "1px solid #F0F0F0" }}>
            <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setActiveStep(1)}>
              <StepBadge n={1} />
              <h3 className="text-base font-semibold" style={{ color: "#18181B" }}>Select a Post or Reel</h3>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Toggle enabled={scope === "account_wide"} onChange={(v) => setScope(v ? "account_wide" : "post_specific")} label="Any post or reel" />
            </div>
            {scope === "post_specific" && (
              <div className="space-y-3">
                {loadingMedia ? (
                  <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#4F46E5" }} /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {/* Next post card */}
                      <div className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
                        style={{ border: "2px dashed #C7D2FE", backgroundColor: "#FAFAFF" }}>
                        <Plus size={20} style={{ color: "#4F46E5" }} />
                        <span className="text-[9px] font-medium mt-1 text-center leading-tight" style={{ color: "#4F46E5" }}>Next Post{"\n"}or Reel</span>
                      </div>
                      {visibleMedia.map(p => {
                        const thumb = p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url;
                        const sel = mediaIds.includes(p.id);
                        return (
                          <div key={p.id} onClick={() => setMediaIds(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all"
                            style={{ border: sel ? "2px solid #4F46E5" : "2px solid transparent", opacity: sel ? 1 : 0.7 }}>
                            {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F4F4F5" }}><ImageIcon size={16} style={{ color: "#A1A1AA" }} /></div>}
                            {sel && <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(79,70,229,0.25)" }}><Check size={18} className="text-white" /></div>}
                          </div>
                        );
                      })}
                    </div>
                    {media.length > 6 && !showMoreMedia && (
                      <button onClick={() => setShowMoreMedia(true)}
                        className="flex items-center gap-1 text-xs font-medium mx-auto" style={{ color: "#4F46E5" }}>
                        <ChevronDown size={14} /> Show More
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── STEP 2: Setup Keywords ───────────────────────────── */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "#FFFFFF", border: activeStep === 2 ? "1px solid #C7D2FE" : "1px solid #F0F0F0" }}>
            <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setActiveStep(2)}>
              <StepBadge n={2} />
              <h3 className="text-base font-semibold" style={{ color: "#18181B" }}>Setup Keywords</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Toggle enabled={anyKeyword} onChange={(v) => setAnyKeyword(v)} label="Any keyword" />
            </div>
            {!anyKeyword && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                    placeholder="Type a keyword and press Enter"
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
                    style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                  <button onClick={addKeyword} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: "#4F46E5" }}>Add</button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map(k => (
                      <span key={k} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                        {k}
                        <button onClick={() => setKeywords(prev => prev.filter(x => x !== k))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px]" style={{ color: "#A1A1AA" }}>Case-insensitive matching</p>
              </div>
            )}
          </div>

          {/* ── STEP 3: Send a DM ────────────────────────────────── */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "#FFFFFF", border: activeStep === 3 ? "1px solid #C7D2FE" : "1px solid #F0F0F0" }}>
            <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setActiveStep(3)}>
              <StepBadge n={3} />
              <h3 className="text-base font-semibold" style={{ color: "#18181B" }}>Send a DM</h3>
            </div>

            {/* Message textarea */}
            <div className="space-y-3">
              <div className="relative">
                <textarea value={dmMessage} onChange={e => setDmMessage(e.target.value)} rows={4}
                  placeholder="Enter your message here..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                <div className="flex items-center justify-between px-1 mt-1">
                  <p className="text-[10px]" style={{ color: "#A1A1AA" }}>
                    {"Use {{username}} for the commenter's name"}
                  </p>
                  <span className="text-[10px]" style={{ color: dmMessage.length > 1000 ? "#DC2626" : "#A1A1AA" }}>
                    {dmMessage.length} / 1000
                  </span>
                </div>
              </div>

              {/* Add Link */}
              {!showLink ? (
                <button onClick={() => setShowLink(true)}
                  className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#4F46E5" }}>
                  <Link2 size={13} /> + Add Link
                </button>
              ) : (
                <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "#FAFAFA" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Link</span>
                    <button onClick={() => { setShowLink(false); setLinkUrl(""); }}
                      className="text-[10px]" style={{ color: "#DC2626" }}>Remove</button>
                  </div>
                  <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    onBlur={() => { if (linkUrl && !linkUrl.startsWith("http")) setLinkUrl("https://" + linkUrl); }}
                    placeholder="https://yoursite.com/offer"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                  <input value={buttonText} onChange={e => setButtonText(e.target.value.slice(0, 25))}
                    placeholder="Button label (e.g. Get the link →)"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                  <div className="flex justify-end">
                    <span className="text-[10px]" style={{ color: buttonText.length >= 25 ? "#DC2626" : "#A1A1AA" }}>{buttonText.length}/25</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Opening Message (not numbered) ───────────────────── */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0F0F0" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#18181B" }}>Opening Message</span>
                <div className="group relative">
                  <Info size={13} style={{ color: "#A1A1AA" }} className="cursor-help" />
                  <div className="hidden group-hover:block absolute left-0 top-5 z-10 w-64 p-3 rounded-lg shadow-lg text-[10px] leading-relaxed"
                    style={{ backgroundColor: "#18181B", color: "#FFFFFF" }}>
                    The Opening DM is like saying &quot;Hey! Can you talk?&quot; before calling. When recipients tap the button, they opt into the conversation, allowing you to send more messages in the next 24 hours.
                  </div>
                </div>
              </div>
              <Toggle enabled={openingEnabled} onChange={setOpeningEnabled} />
            </div>
            {openingEnabled && (
              <div className="space-y-2">
                <textarea value={deliveryMessage} onChange={e => setDeliveryMessage(e.target.value)} rows={2}
                  placeholder="Here's your link! Tap below to access it..."
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                <input value={deliveryButtonText} onChange={e => setDeliveryButtonText(e.target.value.slice(0, 25))}
                  placeholder="Button label (e.g. Access now →)"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
              </div>
            )}
          </div>

          {/* ── Advanced Automations ──────────────────────────────── */}
          <div className="rounded-xl p-5 space-y-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0F0F0" }}>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#18181B" }}>Advanced Automations</h3>
              <p className="text-xs mt-0.5" style={{ color: "#71717A" }}>Grow your audience faster — with smart, hands-free engagement.</p>
            </div>

            {/* Public reply to comments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between" onClick={() => setActiveStep("replies")} style={{ cursor: "pointer" }}>
                <Toggle enabled={commentReplyEnabled} onChange={(v) => { setCommentReplyEnabled(v); setActiveStep("replies"); }} label="Public reply to comments" />
              </div>
              {commentReplyEnabled && (
                <div className="space-y-2 pl-7">
                  <p className="text-[10px]" style={{ color: "#71717A" }}>A variant will be selected at random to avoid repetition.</p>
                  {replyMessages.map((msg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm">💬</span>
                      <input value={msg} onChange={e => { const next = [...replyMessages]; next[idx] = e.target.value; setReplyMessages(next); }}
                        placeholder={`Reply variant ${idx + 1}`}
                        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
                      {replyMessages.length > 1 && (
                        <button onClick={() => setReplyMessages(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 rounded-md" style={{ color: "#A1A1AA" }}><Trash2 size={13} /></button>
                      )}
                    </div>
                  ))}
                  {replyMessages.length < 5 && (
                    <button onClick={() => setReplyMessages(prev => [...prev, ""])}
                      className="flex items-center gap-1 text-xs font-medium" style={{ color: "#4F46E5" }}>
                      <Plus size={12} /> Add Public Reply
                    </button>
                  )}
                  <div className="pt-2">
                    <Toggle enabled={limitReplies} onChange={setLimitReplies} label="Limit public replies" />
                  </div>
                </div>
              )}
            </div>

            {/* Follower gate */}
            <div className="pt-2" style={{ borderTop: "1px solid #F0F0F0" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Toggle enabled={followerGateEnabled} onChange={setFollowerGateEnabled} label="Ask to follow before sending DM" />
                  <div className="group relative">
                    <Info size={13} style={{ color: "#A1A1AA" }} className="cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 top-5 z-10 w-56 p-3 rounded-lg shadow-lg text-[10px] leading-relaxed"
                      style={{ backgroundColor: "#18181B", color: "#FFFFFF" }}>
                      Users must follow your account before they receive the DM. Great for growing your follower count.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
