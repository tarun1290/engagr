"use client";

import React from 'react';
import { Search, Grid } from "lucide-react";
// import { signOut, useSession } from "next-auth/react"; // disabled — Google OAuth not configured
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  // const { data: session } = useSession();

  return (
    <header className="h-[56px] bg-white sticky top-0 border-b border-slate-100 px-8 flex items-center justify-between z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-sm w-full group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent border-none pl-6 pr-4 py-2 text-sm focus:ring-0 outline-none placeholder:text-slate-300 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationCenter />
        <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
          <Grid size={18} />
        </button>
      </div>
    </header>
  );
}
