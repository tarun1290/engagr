"use client";

import React from 'react';
import { LogOut } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-14 sticky top-0 px-6 flex items-center justify-end z-40 gap-3"
      style={{ backgroundColor: '#FAFAFA' }}>
      <a
        href="/api/auth/logout"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
        style={{ color: '#71717A' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
      >
        <LogOut size={16} />
      </a>
    </header>
  );
}
