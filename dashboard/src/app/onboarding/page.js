"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Instagram, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  ChevronDown,
  Lock,
  ExternalLink,
  ShieldCheck as ShieldText
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { getAccountsFromToken, saveDiscoveredAccount } from "../dashboard/actions";

export default function Onboarding() {
  const { user } = useUser();
  const router = useRouter();
  
  const [subStep, setSubStep] = useState(0); // 0: Connect, 3: Success
  const [loading, setLoading] = useState(false);
  const [discoveredAccounts, setDiscoveredAccounts] = useState([]);
  const [connectedUsername, setConnectedUsername] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const appId = process.env.NEXT_PUBLIC_META_APP_ID || "839586385802767";

  // Initialize Instagram SDK (via Meta)
  const initInstagramSDK = () => {
    if (window.FB && !window.fbInitialized) {
      window.FB.init({
        appId: appId,
        cookie: false,
        xfbml: true,
        version: 'v25.0'
      });
      window.fbInitialized = true;
      console.log("Onboarding: Instagram API Initialized");
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (subStep === 3) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [subStep, router]);

  const handleSelectAccount = async (account) => {
    setLoading(true);
    try {
      // The page access token is what the bot needs to send messages on behalf of the IG account.
      const res = await saveDiscoveredAccount({ ...account, userToken: account.pageToken });
      if (res.success) {
        setConnectedUsername(account.username);
        setSubStep(3);
      } else {
        alert("Save Error: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramLogin = () => {
    if (!window.FB) {
      alert("Instagram SDK not loaded yet. Please wait.");
      return;
    }
    console.log("Onboarding: Instagram Login attempt with ID:", appId);
    setLoading(true);
    
    window.FB.login((response) => {
      console.log("Instagram Login Response:", response);
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        handleOAuthTokenDiscovery(accessToken);
      } else {
        setLoading(false);
        console.log("User cancelled login.");
      }
    }, {
      scope: 'instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_read_engagement'
    });
  };

  const handleOAuthTokenDiscovery = async (token) => {
    setLoading(true);
    try {
      const res = await getAccountsFromToken(token);
      if (res.success) {
        setDiscoveredAccounts(res.accounts);
        if (res.accounts.length === 0) {
            if (res.totalPages > 0) {
              alert(`Found ${res.totalPages} linked accounts, but NONE are active Instagram Business accounts. Please ensure your IG account is linked correctly to a Page.`);
            } else {
              alert("No accounts found. Ensure you have selected the right permissions in the Instagram popup.");
            }
        }
      } else {
        alert("Discovery Error: " + res.error);
      }
    } catch (err) {
      alert("Unexpected Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInitial = () => (
    <div className="max-w-4xl w-full grid md:grid-cols-2 gap-16 items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center justify-center space-y-10">
         <div className="relative group/logo">
            <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-2xl group-hover/logo:bg-pink-500/40 transition-all duration-700"></div>
            <div className="w-56 h-56 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center relative border border-white/50 shadow-2xl">
               <div className="w-40 h-40 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-full flex items-center justify-center shadow-inner">
                  <Instagram size={80} className="text-[#E5266E] drop-shadow-lg" />
               </div>
            </div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-[24px] shadow-2xl flex items-center justify-center border border-slate-50 rotate-12 group-hover/logo:rotate-0 transition-transform duration-500">
               <Zap size={32} className="text-pink-500 fill-pink-500" />
            </div>
         </div>
         
         <div className="text-center space-y-5">
            <h2 className="text-6xl font-black text-slate-900 tracking-tight leading-[0.9]">
               Link<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB133] via-[#FF3040] to-[#E5266E]">Instagram</span>
            </h2>
            <p className="text-slate-500 text-[18px] font-medium max-w-[340px] mx-auto leading-relaxed">
               Hello {user?.firstName || 'there'}! Connect your business account to start your AI automation.
            </p>
         </div>
      </div>

      <div className="relative group">
         <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-pink-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
         
         <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[40px] p-8 space-y-6 relative overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 hover:shadow-[0_48px_80px_-24px_rgba(0,0,0,0.15)]">
            <div className="space-y-4 text-center">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 rounded-full text-[10px] font-black text-pink-600 uppercase tracking-widest mb-2">
                  <ShieldText size={12} />
                  Official API Connection
               </div>
               <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">Connect Account</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                  Login with Instagram to authorize your Business account for AI automation.
               </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <button 
                   onClick={handleInstagramLogin}
                   className="group/btn w-full py-6 px-8 bg-gradient-to-tr from-[#FFDA3A] via-[#FF3040] to-[#E5266E] text-white rounded-[24px] font-black text-[18px] flex items-center justify-center gap-4 transition-all shadow-[0_20px_40px_-12px_rgba(229,38,110,0.4)] hover:shadow-[0_24px_48px_-12px_rgba(229,38,110,0.5)] hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                   <Instagram size={24} className="text-white" />
                   Login with Instagram
                </button>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Secure OAuth 2.0</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              {discoveredAccounts.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Account to Link</p>
                  {discoveredAccounts.map((acc) => (
                    <button 
                      key={acc.igId}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full flex items-center gap-4 bg-white border-2 border-slate-100 p-4 rounded-2xl hover:border-pink-500 hover:bg-pink-50/50 transition-all group/acc"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                        <img src={acc.profilePic || `https://ui-avatars.com/api/?name=${acc.username}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-black text-slate-900 group-hover/acc:text-pink-600">@{acc.username}</p>
                        <p className="text-[11px] font-bold text-slate-400 capitalize">{acc.name}</p>
                      </div>
                      <div className="ml-auto w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/acc:bg-pink-600 group-hover/acc:text-white transition-colors">
                        <ArrowRight size={14} />
                      </div>
                    </button>
                  ))}
                  <button onClick={() => setDiscoveredAccounts([])} className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors">← Cancel</button>
                </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-700">
      <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-100 animate-bounce">
         <CheckCircle2 className="text-white" size={48} />
      </div>
      <div className="text-center space-y-4">
         <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Linked!</h2>
         <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">
           Your AI Automation is now live for @{connectedUsername}
         </p>
      </div>
      <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
         <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-progress origin-left"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-12 md:py-20 p-6 relative text-slate-900">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-50/50 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/50 rounded-full blur-[120px]"></div>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center space-y-4">
         <p className="text-[10px] font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full border border-pink-100 uppercase tracking-tighter">
            INSTAGRAM API VERIFIED: {appId}
         </p>
         <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">Secure API Integration</p>
      </div>

      {subStep === 0 && (
         <div className="w-full flex flex-col items-center space-y-12 mb-20">
            {renderInitial()}
            
            <div className="w-full max-w-sm">
               <button 
                 onClick={() => {
                   const guide = document.getElementById('troubleshooting-guide');
                   guide.classList.toggle('hidden');
                 }}
                 className="text-[10px] font-black text-slate-400 hover:text-pink-500 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto py-4 border-t border-slate-50 w-full"
               >
                 Connection issues? <ChevronDown size={14} />
               </button>
               <div id="troubleshooting-guide" className="hidden mt-4 bg-slate-50/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-100 shadow-xl space-y-4 text-left animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 text-pink-600">
                     <ExternalLink size={16} />
                     <p className="text-[11px] font-black uppercase tracking-tight">Configuration Fix</p>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <p className="text-[12px] font-black text-slate-900 leading-tight">1. Business Setup</p>
                        <p className="text-[11px] text-slate-500 font-medium">In Meta Dashboard, go to <strong>Instagram API {" > "} API setup with Instagram login</strong> and click <strong>"Set up"</strong>.</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[12px] font-black text-slate-900 leading-tight">2. Redirect URI</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Add your secure tunnel URL followed by <code className="bg-white px-1 rounded text-pink-600 border border-pink-50 text-[9px]">/onboarding</code> to <strong>Valid OAuth Redirect URIs</strong>.</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[12px] font-black text-slate-900 leading-tight">3. Permission Check</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Ensure you have selected all required Instagram permissions in the popup to allow messaging.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}
      {subStep === 3 && renderSuccess()}

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
          <p className="text-[11px] font-black text-pink-600 uppercase tracking-widest animate-pulse">Connecting to Instagram...</p>
        </div>
      )}
      <Script 
        src="https://connect.facebook.net/en_US/sdk.js" 
        strategy="afterInteractive" 
        onLoad={() => {
          initInstagramSDK();
        }}
      />
    </div>
  );
}

