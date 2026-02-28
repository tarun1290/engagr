import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export default function Hero({ isSignedIn }) {
  return (
    <section className="pt-24 pb-32">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-primary rounded-full border border-pink-100 animate-fade-in">
            <Zap size={16} className="fill-primary" />
            <span className="text-xs font-black uppercase tracking-widest">Next-Gen Automation</span>
          </div>
          
          <h1 className="text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900">
            Automate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB133] via-[#FF3040] to-[#E5266E]">Instagram</span> DMs & Comments.
          </h1>
          
          <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
            The ultimate tool for creators and businesses to manage high-volume interactions without lifting a finger.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link 
              href={isSignedIn ? "/onboarding" : "/sign-up"}
              className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-2xl shadow-pink-200 flex items-center justify-center gap-3 group"
            >
              {isSignedIn ? "Go to Dashboard" : "Start your free trial"}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
              View Demo
            </button>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="absolute -inset-10 bg-gradient-to-tr from-pink-500/30 to-purple-500/30 rounded-[100px] blur-3xl opacity-40 animate-pulse" />
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative bg-slate-950 border-[8px] border-slate-900 rounded-[60px] p-2 shadow-2xl shadow-blue-500/20 w-[320px] mx-auto overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-3xl z-20" />
      <div className="bg-black rounded-[50px] aspect-[9/19] overflow-hidden flex flex-col relative">
        {/* IG Header Simulation */}
        <div className="h-12 flex items-center justify-between px-8 pt-2 text-[10px] text-white font-bold">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-2 border border-white/40 rounded-sm relative">
              <div className="absolute inset-0.5 bg-white rounded-px w-2/3" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px]">
            <div className="w-full h-full rounded-full bg-black border-2 border-black flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-primary flex items-center justify-center text-[10px] font-black text-white">QB</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-white leading-none">query_bot</p>
            <p className="text-[8px] text-emerald-500 font-bold mt-0.5">Automated System</p>
          </div>
        </div>
        <div className="flex-1 p-5 space-y-4 overflow-y-auto no-scrollbar">
          <div className="bg-slate-800/50 text-white p-3 rounded-2xl rounded-bl-none max-w-[85%] text-[10px] leading-relaxed">
            Hey! I saw your comment on my latest post about "AI Tools" 🤖
          </div>
          <div className="bg-primary text-white p-3 rounded-2xl rounded-bl-none max-w-[85%] text-[10px] shadow-lg shadow-pink-500/20 leading-relaxed">
            Here is the link to the toolkit I promised! ✨
          </div>
          <div className="pt-2">
            <div className="bg-white text-primary py-2.5 px-4 rounded-xl text-[10px] font-black text-center shadow-lg">
              GET THE TOOLKIT →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
