"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, Clock, ExternalLink } from "lucide-react";
import { getNotifications } from '@/app/dashboard/actions';
import { cn } from '@/lib/utils';

function NotificationSkeleton() {
  return (
    <div className="p-4" style={{ borderBottom: '1px solid var(--surface-alt)' }}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--surface-alt)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
          <div className="h-3 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
          <div className="h-2 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-alt)' }} />
        </div>
      </div>
    </div>
  );
}

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
    <div className="relative theme-transition" ref={trayRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-all relative group"
        style={isOpen
          ? { backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }
          : { color: 'var(--text-placeholder)' }
        }
        onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--surface-alt)'; }}}
        onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.color = 'var(--text-placeholder)'; e.currentTarget.style.backgroundColor = 'transparent'; }}}
      >
        <Bell size={18} />
        {notifications.length > 0 && !isOpen && (
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full pulse-animation"
            style={{ backgroundColor: 'var(--primary)', border: '1px solid var(--card)' }}
          />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 theme-transition"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--surface-alt)', backgroundColor: 'var(--surface-alt)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ color: 'var(--text-placeholder)', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
            >
              Live
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div>
                {[...Array(3)].map((_, i) => <NotificationSkeleton key={i} />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--surface-alt)' }}>
                   <Bell size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>No recent activity found.</p>
              </div>
            ) : (
              <div>
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className="p-4 transition-colors group cursor-default"
                    style={{ borderBottom: '1px solid var(--surface-alt)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-alt)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--info-light)' }}
                      >
                        <MessageCircle size={14} style={{ color: 'var(--info)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>@{notif.from?.username || 'User'}</span>
                          <span className="mx-1">matched a trigger and received a</span>
                          <span className="font-bold italic" style={{ color: 'var(--primary)' }}>private DM</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--text-placeholder)' }}>
                            <Clock size={10} />
                            {formatTime(notif.createdAt)}
                          </div>
                          {notif.content?.url && (
                             <a
                               href={notif.content.url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="flex items-center gap-1 text-[10px] font-bold hover:underline"
                               style={{ color: 'var(--info)' }}
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

        </div>
      )}
    </div>
  );
}
