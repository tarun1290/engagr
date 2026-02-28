import { Instagram, Zap } from "lucide-react";

export default function AccountSummary({ data, onSwitch }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-10 flex items-center justify-between group">
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-[#FFDA3A] via-[#FF3040] to-[#E5266E]">
            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
              {data.profilePicture ? (
                <img src={data.profilePicture} alt="" className="w-full h-full object-cover" />
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
          <h3 className="text-lg font-black text-slate-900 leading-tight">@{data.username}</h3>
          <div className="flex gap-4 mt-1">
            <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">
              {data.followersCount.toLocaleString()} Followers
            </p>
            <div className="w-1 h-1 rounded-full bg-slate-300 mt-2" />
            <p className="text-[12px] text-emerald-600 font-black uppercase tracking-wider">Connected & Active</p>
          </div>
        </div>
      </div>
      <button 
        onClick={onSwitch}
        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:border-pink-500 hover:text-pink-600 transition-all shadow-sm"
      >
        Switch Account
      </button>
    </div>
  );
}
