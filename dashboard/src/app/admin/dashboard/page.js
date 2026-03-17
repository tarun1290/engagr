import { ShieldCheck, Users, Zap, MessageSquare, Activity, LogOut, Instagram, TrendingUp, UserCheck, Calendar } from "lucide-react";
import { getAdminStats, adminLogout } from "../actions";
import DeleteUserButton from "./DeleteUserButton";

function StatCard({ label, value, sub, icon: Icon, color = "slate" }) {
  const colors = {
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    slate: "bg-slate-700/50 text-slate-300 border-slate-700",
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[20px] p-6 space-y-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-3xl font-black text-white">{value}</p>
        <p className="text-[13px] font-semibold text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-slate-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Inactive
    </span>
  );
}

function EventTypeBadge({ type }) {
  const map = {
    comment:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    mention:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dm:         "bg-pink-500/10 text-pink-400 border-pink-500/20",
    reel_share: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    reaction:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
    postback:   "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${map[type] || "bg-slate-800 text-slate-500 border-slate-700"}`}>
      {type?.replace("_", " ")}
    </span>
  );
}

function EventStatusBadge({ status }) {
  const map = {
    sent:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
    fallback: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    skipped:  "bg-slate-800 text-slate-500 border-slate-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${map[status] || map.skipped}`}>
      {status || "skipped"}
    </span>
  );
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const connectionRate = stats.totalUsers > 0
    ? Math.round((stats.connectedUsers / stats.totalUsers) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
            <ShieldCheck className="text-pink-400" size={16} />
          </div>
          <div>
            <p className="text-sm font-black text-white">Admin Panel</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Ai DM Bot</p>
          </div>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm font-bold transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </form>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">

        {/* Stats Grid */}
        <section>
          <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-5">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="slate" />
            <StatCard icon={Instagram} label="Connected" value={stats.connectedUsers} sub="Instagram linked" color="pink" />
            <StatCard icon={Zap} label="Automations" value={stats.activeAutomations} sub="Currently live" color="emerald" />
            <StatCard icon={Activity} label="Sent Today" value={stats.sentToday} sub="Replies delivered" color="pink" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <StatCard icon={MessageSquare} label="Total Events" value={stats.totalEvents} color="blue" />
            <StatCard icon={UserCheck} label="Connection Rate" value={`${connectionRate}%`} sub="Users with Instagram" color="amber" />
            <StatCard icon={TrendingUp} label="Events Today" value={stats.eventsToday} sub="All interactions" color="emerald" />
          </div>
        </section>

        {/* Event Type Breakdown */}
        {stats.eventsByType.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-5">Interaction Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.eventsByType.map((e) => (
                <div key={e._id} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 flex flex-col gap-2">
                  <EventTypeBadge type={e._id} />
                  <span className="text-2xl font-black text-white">{e.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Users Table */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">
              Registered Users ({stats.users.length})
            </h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-[20px] overflow-hidden">
            {stats.users.length === 0 ? (
              <div className="py-16 text-center text-slate-600 text-sm font-medium">No users registered yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">User</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Instagram</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Automation</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Keywords</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Joined</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.map((user, i) => (
                    <tr key={user._id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i === stats.users.length - 1 ? "border-0" : ""}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-300 text-[13px]">{user.name || "—"}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{user.email || user.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isConnected ? (
                          <div className="flex items-center gap-3">
                            {user.instagramProfilePic && (
                              <img src={user.instagramProfilePic} alt="" className="w-7 h-7 rounded-full border border-slate-700 object-cover" />
                            )}
                            <div>
                              <p className="font-bold text-white text-[13px]">@{user.instagramUsername}</p>
                              <p className="text-[10px] text-slate-600">{user.instagramBusinessId}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">Not connected</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge active={user.automation?.isActive} />
                      </td>
                      <td className="px-6 py-4">
                        {user.automation?.keywords?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.automation.keywords.slice(0, 3).map((k) => (
                              <span key={k} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-mono border border-slate-700">{k}</span>
                            ))}
                            {user.automation.keywords.length > 3 && (
                              <span className="text-slate-600 text-[10px]">+{user.automation.keywords.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-700 text-xs">Any</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar size={11} />
                          <span className="text-xs">{timeAgo(user.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DeleteUserButton userId={user.userId} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Recent Events */}
        <section>
          <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-5">
            Recent Events ({stats.recentEvents.length})
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-[20px] overflow-hidden">
            {stats.recentEvents.length === 0 ? (
              <div className="py-16 text-center text-slate-600 text-sm font-medium">No events recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Type</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">From</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Content</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Reply Sent</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Status</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEvents.map((event, i) => (
                    <tr key={event._id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i === stats.recentEvents.length - 1 ? "border-0" : ""}`}>
                      <td className="px-6 py-4">
                        <EventTypeBadge type={event.type} />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-300 text-[13px]">
                          {event.from?.username ? `@${event.from.username}` : event.from?.id || "—"}
                        </p>
                        {event.from?.name && (
                          <p className="text-[10px] text-slate-600 mt-0.5">{event.from.name}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-slate-500 text-xs truncate">{event.content?.text || "—"}</p>
                      </td>
                      <td className="px-6 py-4 max-w-[180px]">
                        <p className="text-slate-600 text-xs truncate">{event.reply?.privateDM || event.reply?.publicReply || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <EventStatusBadge status={event.reply?.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 text-xs">{timeAgo(event.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
