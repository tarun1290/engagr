"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AtSign, Share2, Link2, MessageSquare, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { getInstagramAccount, saveAutomation } from '@/app/dashboard/actions';
// [PLANS DISABLED] Feature gating imports not needed during Early Access
// import { getSubscriptionStatus } from '@/app/dashboard/billing-actions';
// import { canUseFeature } from '@/lib/gating';
// import UpgradePrompt from './UpgradePrompt';
// [/PLANS DISABLED]
import AccountSummary from './automation/AccountSummary';
import TriggerForm from './automation/TriggerForm';
import ResponseEditor from './automation/ResponseEditor';
import PreviewPhone from './automation/PreviewPhone';

export default function Automation() {
  const [instaData, setInstaData] = useState({ isConnected: false, username: "", media: [], followersCount: 0 });
  const [fetching, setFetching] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  // [PLANS DISABLED] Subscription and feature gate state not needed
  // const [subData, setSubData] = useState(null);
  // const [showFollowGatePrompt, setShowFollowGatePrompt] = useState(false);
  // const [showMentionPrompt, setShowMentionPrompt] = useState(false);
  // [/PLANS DISABLED]

  const [config, setConfig] = useState({
    postTrigger: "specific",
    commentTrigger: "any",
    replyEnabled: true,
    selectedPostId: null,
    keywords: "",
    replyMessages: ["Check your DMs! 📩"],
    dmContent: "Hey there! Thanks so much for your interest 😊\n\nClick below and I'll send you the link right away ✨",
    buttonText: "Yes",
    linkUrl: "",
    deliveryMessage: "",
    deliveryButtonText: "",
    requireFollow: false,
    followPromptPublicReply: "",
    followPromptDM: "",
    followButtonText: "I'm following now! ✓",
    // Mentions tracker
    mentionsEnabled: false,
    mentionReplyMessage: "Thanks for the mention! 🙌",
    // Reel share linker
    reelShareEnabled: false,
    reelShareMessage: "Hey! 👋 Thanks for sharing!",
    reelShareLinkUrl: "",
    reelShareButtonText: "Check it out 🚀",
  });

  useEffect(() => {
    async function load() {
      try {
        // [PLANS DISABLED] getSubscriptionStatus().then(s => { if (s.success) setSubData(s); }).catch(() => {});
        const data = await getInstagramAccount();
        if (data?.isConnected) {
          setInstaData(data);
          if (data.automation) {
            const a = data.automation;
            setConfig(prev => ({
              ...prev,
              postTrigger: a.postTrigger || "specific",
              commentTrigger: a.commentTrigger || "any",
              replyEnabled: a.replyEnabled ?? true,
              selectedPostId: a.selectedPostId || data.media?.[0]?.id || null,
              keywords: a.keywords?.join(", ") || "",
              replyMessages: a.replyMessages?.length > 0 ? [a.replyMessages[0]] : prev.replyMessages,
              dmContent: a.dmContent || prev.dmContent,
              buttonText: a.buttonText || prev.buttonText,
              linkUrl: a.linkUrl || prev.linkUrl,
              deliveryMessage: a.deliveryMessage || "",
              deliveryButtonText: a.deliveryButtonText || "",
              requireFollow: a.requireFollow ?? false,
              followPromptPublicReply: a.followPromptPublicReply || "",
              followPromptDM: a.followPromptDM || "",
              followButtonText: a.followButtonText || "I'm following now! ✓",
              mentionsEnabled: a.mentionsEnabled ?? false,
              mentionReplyMessage: a.mentionReplyMessage || "Thanks for the mention! 🙌",
              reelShareEnabled: a.reelShareEnabled ?? false,
              reelShareMessage: a.reelShareMessage || "Hey! 👋 Thanks for sharing!",
              reelShareLinkUrl: a.reelShareLinkUrl || "",
              reelShareButtonText: a.reelShareButtonText || "Check it out 🚀",
            }));
          } else if (data.media?.length > 0) {
            setConfig(prev => ({ ...prev, selectedPostId: data.media[0].id }));
          }
        }
      } catch (e) {
        console.error("Failed to load Instagram account:", e);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, []);

  const update = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  // [PLANS DISABLED] All features unlocked — no gating checks
  // const userPlan = subData?.plan || "trial";
  const handleFollowToggle = (val) => update('requireFollow', val);
  const handleMentionsToggle = () => update('mentionsEnabled', !config.mentionsEnabled);
  // [/PLANS DISABLED]

  const handlePublish = async () => {
    setPublishing(true);
    setSaved(false);
    try {
      const res = await saveAutomation(config);
      if (res.success) {
        setSaved(true);
        toast.success("Automation saved and live!");
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      toast.error(`Failed to save: ${e.message}`);
    } finally {
      setPublishing(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!instaData.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center theme-transition">
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Instagram Not Connected</h3>
        <p className="max-w-xs text-sm" style={{ color: 'var(--text-muted)' }}>Finish the onboarding to link your Instagram account before setting up automations.</p>
        <button
          onClick={() => window.location.href = '/onboarding'}
          className="mt-4 px-8 py-3 text-white rounded-xl font-bold text-sm"
          style={{ backgroundColor: 'var(--btn-primary-bg)' }}
        >
          Connect Instagram
        </button>
      </div>
    );
  }

  // [PLANS DISABLED] No expired overlay or DM quota warnings during Early Access
  const isExpired = false;
  const dmExhausted = false;
  // [/PLANS DISABLED]

  return (
    <div className="flex flex-col lg:flex-row gap-12 pb-20 theme-transition relative">

      {/* [PLANS DISABLED] Expired overlay, Follow Gate prompt, and Mention Detection prompt removed */}

      {/* Left — config */}
      <div className={cn("flex-1 max-w-xl space-y-10", isExpired && "opacity-40 pointer-events-none")}>

        {/* DM quota exhausted warning */}
        {dmExhausted && !isExpired && (
          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)' }}
          >
            <MessageSquare size={20} style={{ color: 'var(--error)' }} />
            <div className="flex-1">
              <p className="text-[14px] font-bold" style={{ color: 'var(--error-dark)' }}>
                DMs are currently paused
              </p>
              <p className="text-[12px]" style={{ color: 'var(--error-dark)' }}>
                You&apos;ve reached your monthly limit. Your automation can still be configured and saved.
              </p>
            </div>
          </div>
        )}

        <AccountSummary data={instaData} onSwitch={() => window.location.href = '/onboarding'} />

        {/* Trigger rules */}
        <div
          className="rounded-[28px] p-8 shadow-sm theme-transition"
          style={{ backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
        >
          <div className="mb-8">
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Trigger Rules</h2>
            <p className="text-[13px] font-medium mt-1" style={{ color: 'var(--text-placeholder)' }}>
              Choose which post and what type of comment activates the automation.
            </p>
          </div>
          <TriggerForm
            {...config}
            media={instaData.media}
            selectedPost={config.selectedPostId}
            replyToggle={config.replyEnabled}
            setPostTrigger={(v) => update('postTrigger', v)}
            setCommentTrigger={(v) => update('commentTrigger', v)}
            setSelectedPost={(v) => update('selectedPostId', v)}
            setKeywords={(v) => update('keywords', v)}
            setReplyToggle={(v) => update('replyEnabled', v)}
            setReplyMessages={(v) => update('replyMessages', v)}
            setRequireFollow={handleFollowToggle}
            setFollowPromptPublicReply={(v) => update('followPromptPublicReply', v)}
            setFollowPromptDM={(v) => update('followPromptDM', v)}
            setFollowButtonText={(v) => update('followButtonText', v)}
            instagramUsername={instaData.username}
          />
        </div>

        {/* Response config */}
        <div
          className="rounded-[28px] p-8 shadow-sm theme-transition"
          style={{ backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
        >
          <div className="mb-8">
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Response</h2>
            <p className="text-[13px] font-medium mt-1" style={{ color: 'var(--text-placeholder)' }}>
              The private DM sent automatically when the trigger fires.
            </p>
          </div>
          <ResponseEditor
            {...config}
            setDmContent={(v) => update('dmContent', v)}
            setButtonText={(v) => update('buttonText', v)}
            setLinkUrl={(v) => update('linkUrl', v)}
            setDeliveryMessage={(v) => update('deliveryMessage', v)}
            setDeliveryButtonText={(v) => update('deliveryButtonText', v)}
          />
        </div>

        {/* Mentions Tracker */}
        <div
          className="rounded-[28px] p-8 shadow-sm theme-transition"
          style={{ backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-medium)' }}
              >
                <AtSign size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Mentions Tracker</h2>
                <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--text-placeholder)' }}>
                  Auto-reply when someone mentions you in comments.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* [PLANS DISABLED] Gold badge removed — all features unlocked */}
              <button
                onClick={handleMentionsToggle}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
                style={config.mentionsEnabled
                  ? { backgroundColor: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }
                  : { backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {config.mentionsEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {config.mentionsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {config.mentionsEnabled && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-placeholder)' }}>
                  Reply Message
                </label>
                <textarea
                  value={config.mentionReplyMessage}
                  onChange={(e) => update('mentionReplyMessage', e.target.value)}
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all resize-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="Thanks for the mention! 🙌"
                />
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-placeholder)' }}>
                  This public reply is posted under the comment where you were mentioned.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reel Share Linker */}
        <div
          className="rounded-[28px] p-8 shadow-sm theme-transition"
          style={{ backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-medium)' }}
              >
                <Share2 size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Reel Share Linker</h2>
                <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--text-placeholder)' }}>
                  Auto-reply when someone shares your reel/post in DMs.
                </p>
              </div>
            </div>
            <button
              onClick={() => update('reelShareEnabled', !config.reelShareEnabled)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
              style={config.reelShareEnabled
                ? { backgroundColor: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }
                : { backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              {config.reelShareEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {config.reelShareEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {config.reelShareEnabled && (
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-placeholder)' }}>
                  DM Message
                </label>
                <textarea
                  value={config.reelShareMessage}
                  onChange={(e) => update('reelShareMessage', e.target.value)}
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all resize-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="Hey! 👋 Thanks for sharing!"
                />
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-placeholder)' }}>
                  Use <span className="font-bold" style={{ color: 'var(--primary)' }}>{'{name}'}</span> to insert the sender's first name.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-placeholder)' }}>
                  <span className="flex items-center gap-1.5"><Link2 size={12} /> Link URL</span>
                </label>
                <input
                  type="url"
                  value={config.reelShareLinkUrl}
                  onChange={(e) => update('reelShareLinkUrl', e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="https://your-link.com"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-placeholder)' }}>
                  Button Text
                </label>
                <input
                  type="text"
                  value={config.reelShareButtonText}
                  onChange={(e) => update('reelShareButtonText', e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="Check it out 🚀"
                  maxLength={20}
                />
              </div>
            </div>
          )}
        </div>

        {/* Publish */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl text-white"
          )}
          style={
            saved
              ? { backgroundColor: 'var(--success)' }
              : { background: 'linear-gradient(to right, var(--primary), var(--primary-dark))' }
          }
        >
          {publishing && <Loader2 size={18} className="animate-spin" />}
          {saved && <CheckCircle2 size={18} />}
          {publishing ? "Saving..." : saved ? "Automation Live!" : "Save & Activate Automation"}
        </button>
      </div>

      {/* Right — sticky phone preview */}
      <PreviewPhone
        data={instaData}
        {...config}
        selectedPostId={config.selectedPostId}
      />
    </div>
  );
}
