import React, { useState } from 'react';
import { Heart, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PreviewPhone({ data, dmContent, buttonText, linkUrl, selectedPostId }) {
  const [tab, setTab] = useState("DM");
  const currentPost = data.media?.find(p => p.id === selectedPostId) || data.media?.[0];

  return (
    <div className="flex-1 flex justify-center sticky top-24 h-fit pb-12">
      <div className="relative w-[240px] h-[480px] bg-black rounded-[36px] border-[7px] border-[#222] shadow-2xl overflow-hidden">
        
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
               {data.profilePicture ? (
                 <img src={data.profilePicture} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-pink-500" />
               )}
             </div>
             <p className="text-[10px] text-white font-bold">{data.username}</p>
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
                  {data.profilePicture ? (
                    <img src={data.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-pink-500" />
                  )}
                </div>
                <span className="text-[10px] text-white font-bold">{data.username}</span>
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
                  <span className="font-bold mr-2">{data.username}</span>
                  {currentPost?.caption || "Building the future... 🚀✨"}
                </p>
              </div>
            </div>
          )}

          {tab === "Comments" && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 px-3 py-2 opacity-50">
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
                  {data.profilePicture ? (
                    <img src={data.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-pink-500" />
                  )}
                </div>
                <span className="text-[10px] text-white font-bold">{data.username}</span>
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
                  <p className="text-[9px] text-white"><span className="font-bold mr-1">User</span> <span className="text-slate-500">Now</span></p>
                  <p className="text-[9px] text-slate-300 mt-0.5">Automated trigger match</p>
                </div>
              </div>
            </div>
          )}

          {tab === "DM" && (
            <div className="animate-in zoom-in-95 duration-300 h-full flex flex-col pt-4">
              <div className="flex-1 px-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1 items-start">
                  <div className="bg-[#222] text-white p-3 rounded-2xl rounded-tl-none max-w-[85%] text-[9px] leading-relaxed">
                    {dmContent}
                    <button className="w-full mt-3 py-2 bg-[#333] rounded-lg font-bold border border-white/10 uppercase tracking-tighter">
                      {buttonText}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-tr-none text-[9px]">
                    {buttonText}
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-start mt-2">
                  <div className="bg-[#222] text-white px-3 py-2 rounded-2xl rounded-tl-none text-[9px] text-blue-400 underline font-medium">
                    {linkUrl || "yourlink.com"}
                  </div>
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
  );
}
