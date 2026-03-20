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
    replyMessages: ["Thanks! Please see DMs.", "Sent you a message! Check it out!", "Nice! Check your DMs!"],
    dmContent: "Hey there! Thanks so much for your interest 😊\n\nClick below and I'll send you the link right away ✨",
    buttonText: "Send me the link",
    linkUrl: ""
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
              replyMessages: a.replyMessages?.length > 0 ? a.replyMessages : prev.replyMessages,
              dmContent: a.dmContent || prev.dmContent,
              buttonText: a.buttonText || prev.buttonText,
              linkUrl: a.linkUrl || prev.linkUrl,
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
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!instaData.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <h3 className="text-xl font-bold text-slate-900">Instagram Not Connected</h3>
        <p className="text-slate-500 max-w-xs text-sm">Finish the onboarding to link your Instagram account before setting up automations.</p>
        <button
          onClick={() => window.location.href = '/onboarding'}
          className="mt-4 px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm"
        >
          Connect Instagram
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-12 pb-20">

      {/* Left — config */}
      <div className="flex-1 max-w-xl space-y-10">
        <AccountSummary data={instaData} onSwitch={() => window.location.href = '/onboarding'} />

        {/* Trigger rules */}
        <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Trigger Rules</h2>
            <p className="text-[13px] text-slate-400 font-medium mt-1">
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
          />
        </div>

        {/* Response config */}
        <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Response</h2>
            <p className="text-[13px] text-slate-400 font-medium mt-1">
              The private DM sent automatically when the trigger fires.
            </p>
          </div>
          <ResponseEditor
            {...config}
            setDmContent={(v) => update('dmContent', v)}
            setButtonText={(v) => update('buttonText', v)}
            setLinkUrl={(v) => update('linkUrl', v)}
          />
        </div>

        {/* Publish */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl",
            saved
              ? "bg-emerald-500 shadow-emerald-100 text-white"
              : "bg-gradient-to-r from-primary to-pink-600 shadow-pink-100 text-white hover:opacity-90"
          )}
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

