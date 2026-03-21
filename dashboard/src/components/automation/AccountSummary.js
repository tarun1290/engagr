import { Instagram, Zap } from "lucide-react";

export default function AccountSummary({ data, onSwitch }) {
  return (
    <div
      className="rounded-2xl p-6 mb-10 flex items-center justify-between group theme-transition"
      style={{ backgroundColor: 'var(--surface-alt)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-5">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-full p-1"
            style={{ background: 'linear-gradient(to top right, var(--primary), var(--primary-dark))' }}
          >
            <div
              className="w-full h-full rounded-full border-2 overflow-hidden"
              style={{ borderColor: 'var(--card)', backgroundColor: 'var(--surface-alt)' }}
            >
              {data.profilePicture ? (
                <img src={data.profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-placeholder)' }}>
                  <Instagram size={24} />
                </div>
              )}
            </div>
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 border-2 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--success)', borderColor: 'var(--card)' }}
          >
            <Zap size={10} className="text-white fill-white" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-black leading-tight" style={{ color: 'var(--text-primary)' }}>@{data.username}</h3>
          <div className="flex gap-4 mt-1">
            <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {data.followersCount.toLocaleString()} Followers
            </p>
            <div className="w-1 h-1 rounded-full mt-2" style={{ backgroundColor: 'var(--text-placeholder)' }} />
            <p className="text-[12px] font-black uppercase tracking-wider" style={{ color: 'var(--success)' }}>Connected & Active</p>
          </div>
        </div>
      </div>
      <button
        onClick={onSwitch}
        className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
        style={{ backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-placeholder)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-placeholder)'; }}
      >
        Switch Account
      </button>
    </div>
  );
}
