"use client";

import React from 'react';
import { 
  HelpCircle, 
  Zap, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight,
  Search,
  LifeBuoy
} from "lucide-react";
import { cn } from "@/lib/utils";

const HelpSection = ({ icon: Icon, title, description, items }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 card-shadow hover:border-blue-100 transition-all group">
    <div className="flex items-start justify-between mb-8">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
        <Icon size={24} />
      </div>
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{title}</h3>
    <p className="text-sm text-slate-500 mb-6 leading-relaxed">{description}</p>
    
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer group/item transition-all">
          <span className="text-[13px] font-medium text-slate-600 group-hover/item:text-blue-600">{item}</span>
          <ChevronRight size={14} className="text-slate-300 group-hover/item:text-blue-400 group-hover/item:translate-x-1 transition-all" />
        </div>
      ))}
    </div>
  </div>
);

const FAQItem = ({ question, answer }) => (
  <div className="p-6 rounded-2xl bg-white border border-slate-50 hover:border-slate-100 transition-all">
    <h4 className="text-[14px] font-bold text-slate-900 mb-2">{question}</h4>
    <p className="text-[13px] text-slate-500 leading-relaxed">{answer}</p>
  </div>
);

export default function HelpCenter() {
  return (
    <div className="space-y-12 pb-20">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-black tracking-tight leading-none">
              Help Center
          </h2>
          <p className="text-[16px] font-medium text-slate-400">
             Everything you need to master your Ai DM Bot automation.
          </p>
        </div>
        
        <div className="relative w-full max-w-md">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder="Search documentation..." 
             className="w-full bg-slate-50 border-none pl-12 pr-6 py-4 rounded-2xl text-[14px] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
           />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <HelpSection 
          icon={Zap}
          title="Account Setup"
          description="Connect your Instagram Business profile and get your bot online for the first time."
          items={[
            "How do I link my Instagram profile?",
            "Where do I find my Secret Connection Key?",
            "Activity Log troubleshooting guide",
            "Guide to App Configuration settings"
          ]}
        />
        
        <HelpSection 
          icon={MessageSquare}
          title="Building Automations"
          description="Understand how to create auto-replies for comments, mentions, and direct messages."
          items={[
            "Setting up a Comment-to-DM flow",
            "Auto-replying to Story mentions",
            "Using button templates in messages",
            "Creating visual menus for users"
          ]}
        />

        <HelpSection 
          icon={ShieldCheck}
          title="Technical Support"
          description="Resolve account access issues, permissions problems, or unexpected bot behavior."
          items={[
            "Re-linking expired connections",
            "Required Instagram permissions",
            "Bot response time optimization",
            "Webhook verification guide"
          ]}
        />
      </section>

      <section className="space-y-8">
          <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-black">Common Questions</h3>
              <button className="text-blue-500 text-[14px] font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FAQItem 
                question="Why didn't my bot reply to a comment?" 
                answer="This usually happens if the connection to Instagram is inactive or permissions have changed. Try refreshing your login in Settings." 
              />
              <FAQItem 
                question="How do I personalize the greeting message?" 
                answer="You can update global variables and greetings in the Home dashboard to match your brand's voice." 
              />
              <FAQItem 
                question="Can I use specific keywords as triggers?" 
                answer="Yes! You can set up exact or fuzzy keyword triggers so the bot only responds to relevant inquiries." 
              />
              <FAQItem 
                question="Is there a limit to how many messages I can send?" 
                answer="We follow official Instagram API guidelines to ensure your account remains safe and compliant while maximizing engagement." 
              />
          </div>
      </section>

      <section className="bg-blue-600 rounded-[40px] p-12 text-white overflow-hidden relative group">
          <div className="relative z-10 space-y-6 max-w-2xl">
              <h3 className="text-4xl font-black tracking-tight leading-tight">Still stuck?</h3>
              <p className="text-blue-100 text-[16px] font-medium opacity-90">
                  Our support team is available to help you with technical issues or complex automation flows.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                  <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-[14px] hover:scale-105 transition-all">
                       Message Support
                  </button>
                  <button className="bg-blue-700/50 text-white px-8 py-4 rounded-2xl font-bold text-[14px] hover:bg-blue-700 transition-all border border-white/10">
                       Browse Full Documentation
                  </button>
              </div>
          </div>
          <LifeBuoy size={300} className="absolute -bottom-20 -right-20 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-1000" />
      </section>
    </div>
  );
}
