"use client";

import React from 'react';
import { Search, Bell, Grid, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import NotificationCenter from './NotificationCenter';

export default function Navbar() {
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
        <div className="h-6 w-px bg-slate-100 mx-2" />
        <div className="flex items-center gap-2 pl-2">
            <UserButton />
        </div>
      </div>
    </header>
  );
}
