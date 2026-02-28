"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, Clock, ExternalLink } from "lucide-react";
import { getNotifications } from '@/app/dashboard/actions';
import { cn } from '@/lib/utils';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const trayRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (trayRef.current && !trayRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={trayRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-lg transition-all relative group",
          isOpen ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
        )}
      >
        <Bell size={18} />
        {notifications.length > 0 && !isOpen && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full border border-white pulse-animation" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
              Live
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center space-y-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-medium text-slate-400">Syncing events...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                   <Bell size={16} className="text-slate-300" />
                </div>
                <p className="text-xs font-medium text-slate-500">No recent activity found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div key={notif._id} className="p-4 hover:bg-slate-50 transition-colors group cursor-default">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={14} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-slate-700 leading-snug">
                          <span className="font-bold text-slate-900">@{notif.from?.username || 'User'}</span>
                          <span className="mx-1">matched a trigger and received a</span>
                          <span className="font-bold text-primary italic">private DM</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Clock size={10} />
                            {formatTime(notif.createdAt)}
                          </div>
                          {notif.content?.url && (
                             <a 
                               href={notif.content.url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center gap-1 text-[10px] text-blue-500 font-bold hover:underline"
                             >
                               View Post <ExternalLink size={8} />
                             </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
