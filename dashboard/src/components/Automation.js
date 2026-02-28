"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  MoreHorizontal, 
  Heart, 
  MessageCircle, 
  Send,
  Plus,
  Info,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInstagramAccount, saveAutomation } from '@/app/dashboard/actions';
import { toast } from 'sonner';

const RadioOption = ({ selected, onClick, label, pro }) => (
  <div 
    onClick={onClick} 
    className="flex items-center gap-3 mb-4 cursor-pointer group select-none"
  >
    <div className={cn(
      "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all",
      selected ? "border-blue-500 bg-blue-500" : "border-slate-300 group-hover:border-slate-400"
    )}>
      {selected && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
    </div>
    <span className="text-[14px] text-slate-700 font-medium">{label}</span>
    {pro && (
      <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ml-1">
        PRO
      </span>
    )}
  </div>
);

const Toggle = ({ on, onClick }) => (
  <div 
    onClick={onClick} 
    className={cn(
      "w-10 h-[22px] rounded-full relative cursor-pointer transition-colors flex-shrink-0",
      on ? "bg-emerald-500" : "bg-slate-200"
    )}
  >
    <div className={cn(
      "absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all",
      on ? "left-[21px]" : "left-[3px]"
    )} />
  </div>
);

export default function Automation() {
  const [instaData, setInstaData] = useState({ isConnected: false, username: "Profile", media: [], followersCount: 0 });
  const [fetching, setFetching] = useState(true);
  
  const [postTrigger, setPostTrigger] = useState("specific");
  const [commentTrigger, setCommentTrigger] = useState("any");
  const [replyToggle, setReplyToggle] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [tab, setTab] = useState("Comments");
  const [step, setStep] = useState(1);
  const [keywords, setKeywords] = useState("");
  const [replyMessages, setReplyMessages] = useState(["Thanks! Please see DMs.", "Sent you a message! Check it out!", "Nice! Check your DMs!"]);
  const [dmContent, setDmContent] = useState("Hey there! I'm so happy you're here, thanks so much for your interest 😊\n\nClick below and I'll send you the link in just a sec ✨");
  const [buttonText, setButtonText] = useState("Send me the link");
  const [linkUrl, setLinkUrl] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const data = await getInstagramAccount();
        if (data && data.isConnected) {
          setInstaData(data);
          
          if (data.automation) {
            const auto = data.automation;
            setPostTrigger(auto.postTrigger || "specific");
            setCommentTrigger(auto.commentTrigger || "any");
            setReplyToggle(auto.replyEnabled ?? true);
            setSelectedPost(auto.selectedPostId || (data.media?.length > 0 ? data.media[0].id : null));
            setKeywords(auto.keywords?.join(", ") || "");
            if (auto.replyMessages?.length > 0) setReplyMessages(auto.replyMessages);
            if (auto.dmContent) setDmContent(auto.dmContent);
            if (auto.buttonText) setButtonText(auto.buttonText);
            if (auto.linkUrl) setLinkUrl(auto.linkUrl);
          } else if (data.media?.length > 0) {
            setSelectedPost(data.media[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load Instagram account:", error);
      } finally {
        setFetching(false);
      }
    };
    loadAccount();
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await saveAutomation({
        postTrigger,
        selectedPostId: selectedPost,
        commentTrigger,
        keywords,
        replyEnabled: replyToggle,
        replyMessages,
        dmContent,
        buttonText,
        linkUrl
      });
      if (res.success) {
        toast.success("Automation published successfully!");
      }
    } catch (error) {
      toast.error("Failed to publish automation: " + error.message);
    } finally {
      setPublishing(false);
    }
  };

  const currentPost = instaData.media.find(p => p.id === selectedPost) || instaData.media[0];

  if (fetching) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!instaData.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-2">
           <MessageCircle className="text-slate-300" size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Instagram Not Connected</h3>
        <p className="text-slate-500 max-w-xs text-sm">Please finish the onboarding process to link your Instagram Business account.</p>
        <button onClick={() => window.location.href='/onboarding'} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-100">Connect Now</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[80vh] gap-12 pt-4">
      
      {/* Configuration Form */}
      <div className="flex-1 max-w-xl pb-20">
        <div className="animate-in slide-in-from-left-4 duration-300">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-10 flex items-center justify-between group">
             <div className="flex items-center gap-5">
               <div className="relative">
                 <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-[#FFDA3A] via-[#FF3040] to-[#E5266E]">
                   <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                     {instaData.profilePicture ? (
                       <img src={instaData.profilePicture} alt="" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-300">
                         <Instagram size={24} />
                       </div>
                     )}
                   </div>
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                   <Zap size={10} className="text-white fill-white" />
                 </div>
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">@{instaData.username}</h3>
                  <div className="flex gap-4 mt-1">
                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">{instaData.followersCount.toLocaleString()} Followers</p>
                    <div className="w-1 h-1 rounded-full bg-slate-300 mt-2" />
                    <p className="text-[12px] text-emerald-600 font-black uppercase tracking-wider">Connected & Active</p>
                  </div>
               </div>
             </div>
             <button 
                onClick={() => window.location.href='/onboarding'}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:border-pink-500 hover:text-pink-600 transition-all shadow-sm"
             >
                Switch Account
             </button>
          </div>

          <h2 className="text-[17px] font-bold text-slate-900 mb-6 font-primary">When someone comments on</h2>
          
          <div className="space-y-1 mb-8">
            <RadioOption 
              selected={postTrigger === "specific"} 
              onClick={() => setPostTrigger("specific")} 
              label="a specific post or reel" 
            />

            {postTrigger === "specific" && (
              <div className="ml-8 mb-6">
                <div className="flex gap-2 flex-wrap mb-3">
                  {instaData.media.map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedPost(p.id)} 
                      className={cn(
                        "w-[70px] h-[70px] rounded-xl overflow-hidden cursor-pointer transition-all border-[2.5px] bg-slate-100",
                        selectedPost === p.id ? "border-blue-500 shadow-lg shadow-blue-100 scale-105" : "border-transparent opacity-80"
                      )}
                    >
                      <img 
                        src={p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url} 
                        alt="IG Post" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                {instaData.media.length === 0 && (
                   <p className="text-xs text-slate-400 italic">No recent posts found.</p>
                )}
                <button className="text-emerald-500 text-[13px] font-bold hover:underline">Show All</button>
              </div>
            )}

            <RadioOption 
              selected={postTrigger === "any"} 
              onClick={() => setPostTrigger("any")} 
              label="any post or reel" 
              pro 
            />
            <RadioOption 
              selected={postTrigger === "next"} 
              onClick={() => setPostTrigger("next")} 
              label="next post or reel" 
              pro 
            />
          </div>

          <div className="h-px bg-slate-100 w-full my-8" />

          <h2 className="text-[17px] font-bold text-slate-900 mb-6">And this comment has</h2>
          
          <div className="space-y-1 mb-8">
            <RadioOption 
              selected={commentTrigger === "specific"} 
              onClick={() => setCommentTrigger("specific")} 
              label="a specific word or words" 
            />

            {commentTrigger === "specific" && (
              <div className="ml-8 mb-6 space-y-3">
                <div className="relative">
                  <input 
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Enter a word or multiple"
                    className="w-full bg-white border border-slate-200 rounded-xl h-11 px-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Use commas to separate words</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Example:</span>
                  {["Price", "Link", "Shop"].map(word => (
                    <button 
                      key={word}
                      onClick={() => setKeywords(prev => prev ? `${prev}, ${word}` : word)}
                      className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <RadioOption 
              selected={commentTrigger === "any"} 
              onClick={() => setCommentTrigger("any")} 
              label="any word" 
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[13px] text-slate-700">
              <span>reply to their comments under the post</span>
              <Toggle on={replyToggle} onClick={() => setReplyToggle(!replyToggle)} />
            </div>

            {replyToggle && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {replyMessages.map((text, i) => (
                  <input 
                    key={i}
                    type="text"
                    value={text}
                    onChange={(e) => {
                      const newMessages = [...replyMessages];
                      newMessages[i] = e.target.value;
                      setReplyMessages(newMessages);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl h-10 px-4 text-sm focus:border-blue-400 outline-none transition-all placeholder:text-slate-300"
                  />
                ))}
              </div>
            )}
          </div>

          {step === 1 && (
            <button 
              onClick={() => setStep(2)}
              className="mt-10 px-8 py-2.5 rounded-lg border border-slate-300 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              Next
            </button>
          )}
        </div>

        {step >= 2 && (
          <div className="animate-in slide-in-from-top-6 duration-500 mt-16 pt-16 border-t border-slate-100">
            <h2 className="text-[17px] font-bold text-slate-900 mb-6">They will get</h2>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-slate-700 font-medium">an opening DM</span>
                  <Toggle on={true} onClick={() => {}} />
                </div>
                
                <div className="space-y-3">
                  <textarea 
                    className="w-full bg-white border border-blue-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all min-h-[120px] leading-relaxed resize-none"
                    value={dmContent}
                    onChange={(e) => setDmContent(e.target.value)}
                  />
                  
                  <input 
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl h-11 px-4 text-sm focus:border-blue-400 outline-none transition-all"
                    placeholder="Button label..."
                  />
                  
                  <button className="text-[11px] text-blue-500 font-medium hover:underline flex items-center gap-1.5">
                    <Info size={12} />
                    Why does an Opening DM matter?
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-slate-700 font-medium">a DM asking to follow you before they get the link</span>
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">PRO</span>
                  </div>
                  <Toggle on={false} onClick={() => {}} />
                </div>

                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-slate-700 font-medium">a DM asking for their email</span>
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">PRO</span>
                  </div>
                  <Toggle on={false} onClick={() => {}} />
                </div>
              </div>

              {/* New "And then" Section */}
              <div className="pt-10 mt-10 border-t-2 border-dashed border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-[17px] font-bold text-slate-900 mb-6">And then, they will get</h2>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-slate-700 font-medium">a DM with a link</span>
                      <Toggle on={true} onClick={() => {}} />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <input 
                          type="text"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="doteyelabs.com"
                          className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-blue-600"
                        />
                      </div>
                      
                      <button className="w-full py-3 rounded-xl border-2 border-dashed border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-100 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                        <Plus size={14} /> Add A Link
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between group cursor-pointer pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-slate-700 font-medium">a follow up DM if they don't click the link</span>
                      <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">PRO</span>
                    </div>
                    <Toggle on={false} onClick={() => {}} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-12 pb-10">
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-2.5 rounded-lg border border-slate-300 font-bold text-sm hover:bg-slate-50 transition-all text-slate-600"
              >
                Back to Part 1
              </button>
              <button 
                onClick={handlePublish}
                disabled={publishing}
                className="px-10 py-3 rounded-xl bg-gradient-to-r from-[#FF3040] to-[#E5266E] text-white font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-pink-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {publishing && <Loader2 size={16} className="animate-spin" />}
                {publishing ? "Publishing..." : "Publish Automation"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Phone Preview */}
      <div className="flex-1 flex justify-center sticky top-24 h-fit pb-12">
        <div className="relative w-[240px] h-[480px] bg-black rounded-[36px] border-[7px] border-[#222] shadow-2xl overflow-hidden shadow-black/50">
          
          {/* Status Bar */}
          <div className="px-4 pt-2.5 pb-1 flex justify-between items-center text-[9px] text-white/90">
            <span>10:27</span>
            <div className="flex gap-1 font-mono leading-none">
              <span>▌▌▌</span><span>≋</span><span>▮</span>
            </div>
          </div>

          {/* IG Nav */}
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/5">
            <span className="text-white text-lg">‹</span>
            <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
                 {instaData.profilePicture ? (
                   <img src={instaData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-pink-500" />
                 )}
               </div>
               <p className="text-[10px] text-white font-bold">{instaData.username}</p>
            </div>
            <div className="flex gap-3 text-white">
               <span className="text-xs">📞</span>
               <span className="text-xs">📹</span>
            </div>
          </div>

          <div className="bg-black h-full overflow-y-auto no-scrollbar pb-32">
            {tab === "Post" && (
              <div className="animate-in fade-in duration-300 h-full">
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
                    {instaData.profilePicture ? (
                      <img src={instaData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-pink-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-white font-bold">{instaData.username}</span>
                  <span className="ml-auto text-slate-500 tracking-widest leading-none">···</span>
                </div>
                {currentPost && (
                  <div className="bg-slate-900 border-y border-white/5 h-[240px] flex items-center justify-center overflow-hidden">
                    <img 
                      src={currentPost.media_type === "VIDEO" ? currentPost.thumbnail_url : currentPost.media_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3 flex items-center gap-4">
                  <Heart size={20} className="text-white" />
                  <MessageCircle size={20} className="text-white" />
                  <Send size={20} className="text-white" />
                </div>
                <div className="px-3 space-y-1">
                  <p className="text-[10px] text-white font-bold">
                    {currentPost?.like_count?.toLocaleString() || "0"} likes
                  </p>
                  <p className="text-[10px] text-white line-clamp-2">
                    <span className="font-bold mr-2">{instaData.username}</span>
                    {currentPost?.caption || "Building the future... 🚀✨"}
                  </p>
                </div>
              </div>
            )}

            {tab === "Comments" && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2 px-3 py-2 opacity-50">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
                    {instaData.profilePicture ? (
                      <img src={instaData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-pink-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-white font-bold">{instaData.username}</span>
                </div>
                {currentPost && (
                  <div className="h-[120px] flex items-center justify-center overflow-hidden opacity-80">
                    <img 
                      src={currentPost.media_type === "VIDEO" ? currentPost.thumbnail_url : currentPost.media_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="bg-[#111] p-2.5 border-t border-white/5 text-center mt-2 rounded-t-2xl">
                  <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mb-2" />
                  <p className="text-[10px] text-white font-bold">
                    {currentPost?.comments_count ? `${currentPost.comments_count.toLocaleString()} Comments` : "Comments"}
                  </p>
                </div>

                <div className="bg-[#111] px-3 py-4 flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-white">U</div>
                  <div className="flex-1">
                    <p className="text-[9px] text-white"><span className="font-bold mr-1">Username</span> <span className="text-slate-500">Now</span></p>
                    <p className="text-[9px] text-slate-300 mt-0.5">Leaves any comment</p>
                    <p className="text-[8px] text-slate-600 font-bold mt-1">Reply</p>
                  </div>
                  <span className="text-slate-600 text-xs">♡</span>
                </div>

                <div className="bg-[#111] border-t border-white/5 px-3 py-1.5 flex justify-between">
                  {["❤️","🙌","🔥","👏","🥺","😂","😍"].map((e, i) => (
                    <span key={i} className="text-xs">{e}</span>
                  ))}
                </div>

                <div className="bg-[#111] p-2 pt-1 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
                    {instaData.profilePicture ? (
                      <img src={instaData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-pink-500" />
                    )}
                  </div>
                  <div className="flex-1 bg-[#1f1f1f] rounded-full px-3 py-1 text-[8px] text-slate-500">
                    Add a comment...
                  </div>
                </div>
              </div>
            )}

            {tab === "DM" && (
              <div className="animate-in zoom-in-95 duration-300 h-full flex flex-col pt-4">
                <div className="flex-1 px-4 flex flex-col gap-3">
                  {/* Sent Message */}
                  <div className="flex flex-col gap-1 items-start">
                    <div className="bg-[#222] text-white p-3 rounded-2xl rounded-tl-none max-w-[85%] text-[9px] leading-relaxed">
                      {dmContent}
                      <button className="w-full mt-3 py-2 bg-[#333] rounded-lg font-bold border border-white/10">
                        {buttonText}
                      </button>
                    </div>
                  </div>

                  {/* Incoming Reply simulation */}
                  <div className="flex justify-end mt-2">
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-tr-none text-[9px]">
                      {buttonText}
                    </div>
                  </div>

                  {/* Final Link Message */}
                  <div className="flex flex-col gap-1 items-start mt-2">
                    <div className="bg-[#222] text-white px-3 py-2 rounded-2xl rounded-tl-none text-[9px] text-blue-400 underline font-medium">
                      {linkUrl || "doteyelabs.com"}
                    </div>
                  </div>
                </div>

                <div className="p-3 mb-10">
                  <div className="flex items-center gap-2 bg-[#1f1f1f] rounded-full px-3 py-2">
                     <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">📷</div>
                     <div className="flex-1 text-[9px] text-slate-500">Message...</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Tabs */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 rounded-full bg-black/80 backdrop-blur-md">
            {['Post', 'Comments', 'DM'].map(t => (
              <button 
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[8px] font-bold transition-all",
                  tab === t ? "bg-[#2a2a2a] text-white border border-white/10" : "text-slate-500"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
