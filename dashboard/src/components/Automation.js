"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { getInstagramAccount, saveAutomation } from '@/app/dashboard/actions';
import AccountSummary from './automation/AccountSummary';
import TriggerForm from './automation/TriggerForm';
import ResponseEditor from './automation/ResponseEditor';
import PreviewPhone from './automation/PreviewPhone';

export default function Automation() {
  const [instaData, setInstaData] = useState({ isConnected: false, username: "", media: [], followersCount: 0 });
  const [fetching, setFetching] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);

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
  });

  useEffect(() => {
    async function load() {
      try {
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

  return (
    <div className="flex flex-col lg:flex-row gap-12 pb-20 theme-transition">

      {/* Left — config */}
      <div className="flex-1 max-w-xl space-y-10">
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
            setRequireFollow={(v) => update('requireFollow', v)}
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
