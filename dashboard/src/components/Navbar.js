"use client";

import React from 'react';
import { LogOut, Sun, Moon } from "lucide-react";
import NotificationCenter from './NotificationCenter';
import { useTheme } from './ThemeProvider';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-[56px] sticky top-0 px-8 flex items-center justify-end z-40 gap-2 theme-transition"
      style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <NotificationCenter />
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg transition-all"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-alt)'; e.currentTarget.style.color = 'var(--primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <a
        href="/api/auth/logout"
        className="p-2 rounded-lg transition-all"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-light)'; e.currentTarget.style.color = 'var(--error)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        title="Logout"
      >
        <LogOut size={18} />
      </a>
    </header>
  );
}
