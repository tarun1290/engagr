"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

import { getInstagramAccount, saveAutomation } from '@/app/dashboard/actions';
import AccountSummary from './automation/AccountSummary';
import TriggerForm from './automation/TriggerForm';
import ResponseEditor from './automation/ResponseEditor';
import PreviewPhone from './automation/PreviewPhone';

/**
 * Main Automation Dashboard Component
 * Manages the logic for setting up Instagram auto-replies.
 */
export default function Automation() {
  const [instaData, setInstaData] = useState({ isConnected: false, username: "Profile", media: [], followersCount: 0 });
  const [fetching, setFetching] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [step, setStep] = useState(1);

  // Automation Configuration State
  const [config, setConfig] = useState({
    postTrigger: "specific",
    commentTrigger: "any",
    replyEnabled: true,
    selectedPostId: null,
    keywords: "",
    replyMessages: ["Thanks! Please see DMs.", "Sent you a message! Check it out!", "Nice! Check your DMs!"],
    dmContent: "Hey there! I'm so happy you're here, thanks so much for your interest 😊\n\nClick below and I'll send you the link in just a sec ✨",
    buttonText: "Send me the link",
    linkUrl: ""
  });

  useEffect(() => {
    async function loadAccount() {
      try {
        const data = await getInstagramAccount();
        if (data?.isConnected) {
          setInstaData(data);
          
          if (data.automation) {
            const auto = data.automation;
            setConfig(prev => ({
              ...prev,
              postTrigger: auto.postTrigger || "specific",
              commentTrigger: auto.commentTrigger || "any",
              replyEnabled: auto.replyEnabled ?? true,
              selectedPostId: auto.selectedPostId || (data.media?.[0]?.id || null),
              keywords: auto.keywords?.join(", ") || "",
              replyMessages: auto.replyMessages?.length > 0 ? auto.replyMessages : prev.replyMessages,
              dmContent: auto.dmContent || prev.dmContent,
              buttonText: auto.buttonText || prev.buttonText,
              linkUrl: auto.linkUrl || prev.linkUrl
            }));
          } else if (data.media?.length > 0) {
            setConfig(prev => ({ ...prev, selectedPostId: data.media[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to sync Instagram account:", error);
      } finally {
        setFetching(false);
      }
    }
    loadAccount();
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await saveAutomation(config);
      if (res.success) {
        toast.success("Automation live!");
      }
    } catch (error) {
      toast.error(`Publishing failed: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (fetching) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!instaData.isConnected) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
          <h3 className="text-xl font-bold text-slate-900">Instagram Not Connected</h3>
          <p className="text-slate-500 max-w-xs text-sm">Please finish the onboarding process to link your Instagram account.</p>
          <button onClick={() => window.location.href='/onboarding'} className="mt-4 px-8 py-3 bg-primary text-white rounded-xl font-bold">Connect Now</button>
        </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[80vh] gap-12 pt-4 pb-20">
      
      <div className="flex-1 max-w-xl">
        <AccountSummary 
          data={instaData} 
          onSwitch={() => window.location.href='/onboarding'} 
        />

        <TriggerForm 
          {...config}
          media={instaData.media}
          setPostTrigger={(val) => updateConfig('postTrigger', val)}
          setCommentTrigger={(val) => updateConfig('commentTrigger', val)}
          setSelectedPost={(val) => updateConfig('selectedPostId', val)}
          setKeywords={(val) => updateConfig('keywords', val)}
          setReplyToggle={(val) => updateConfig('replyEnabled', val)}
          setReplyMessages={(val) => updateConfig('replyMessages', val)}
          selectedPost={config.selectedPostId}
          replyToggle={config.replyEnabled}
        />

        {step === 1 ? (
          <button 
            onClick={() => setStep(2)}
            className="mt-10 px-8 py-3 rounded-xl border border-slate-200 font-bold text-sm bg-white hover:bg-slate-50 shadow-sm"
          >
            Configure Responses
          </button>
        ) : (
          <>
            <ResponseEditor 
              {...config}
              setDmContent={(val) => updateConfig('dmContent', val)}
              setButtonText={(val) => updateConfig('buttonText', val)}
              setLinkUrl={(val) => updateConfig('linkUrl', val)}
            />

            <div className="flex items-center gap-4 mt-12">
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-500"
              >
                Back
              </button>
              <button 
                onClick={handlePublish}
                disabled={publishing}
                className="px-10 py-3 rounded-xl bg-gradient-to-r from-primary to-pink-600 text-white font-black text-sm shadow-xl shadow-pink-100 flex items-center gap-2"
              >
                {publishing && <Loader2 size={16} className="animate-spin" />}
                {publishing ? "Saving..." : "Publish Automation"}
              </button>
            </div>
          </>
        )}
      </div>

      <PreviewPhone 
        data={instaData} 
        {...config} 
        selectedPostId={config.selectedPostId} 
      />

    </div>
  );
}
