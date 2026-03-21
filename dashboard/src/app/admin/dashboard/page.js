import { ShieldCheck, Users, Zap, MessageSquare, Activity, LogOut, Instagram, TrendingUp, UserCheck, Calendar } from "lucide-react";
import { getAdminStats, adminLogout } from "../actions";
import DeleteUserButton from "./DeleteUserButton";

// Force dynamic rendering — admin dashboard must always show fresh DB data
export const dynamic = "force-dynamic";

function StatCard({ label, value, sub, icon: Icon, color = "slate" }) {
  const colors = {
    pink:    "bg-pink-50 text-pink-500 border-pink-100",
    emerald: "bg-emerald-50 text-emerald-500 border-emerald-100",
    blue:    "bg-blue-50 text-blue-500 border-blue-100",
    amber:   "bg-amber-50 text-amber-500 border-amber-100",
    slate:   "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-[20px] p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900">{value}</p>
        <p className="text-[13px] font-semibold text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Inactive
    </span>
  );
}

function EventTypeBadge({ type }) {
  const map = {
    comment:    "bg-blue-50 text-blue-600 border-blue-200",
    mention:    "bg-purple-50 text-purple-600 border-purple-200",
    dm:         "bg-pink-50 text-pink-600 border-pink-200",
    reel_share: "bg-amber-50 text-amber-600 border-amber-200",
    reaction:   "bg-rose-50 text-rose-600 border-rose-200",
    postback:   "bg-cyan-50 text-cyan-600 border-cyan-200",
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${map[type] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {type?.replace("_", " ")}
    </span>
  );
}

function EventStatusBadge({ status }) {
  const map = {
    sent:     "bg-emerald-50 text-emerald-600 border-emerald-200",
    failed:   "bg-rose-50 text-rose-600 border-rose-200",
    fallback: "bg-amber-50 text-amber-600 border-amber-200",
    skipped:  "bg-slate-100 text-slate-400 border-slate-200",
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
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <header className="border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
            <ShieldCheck className="text-primary" size={16} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Admin Panel</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Engagr</p>
          </div>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 text-sm font-bold transition-all shadow-sm">
            <LogOut size={14} /> Sign Out
          </button>
        </form>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">

        {/* Stats Grid */}
        <section>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}       label="Total Users"   value={stats.totalUsers}         color="slate"   />
            <StatCard icon={Instagram}   label="Connected"     value={stats.connectedUsers}      sub="Instagram linked"    color="pink"    />
            <StatCard icon={Zap}         label="Automations"   value={stats.activeAutomations}   sub="Currently live"      color="emerald" />
            <StatCard icon={Activity}    label="Sent Today"    value={stats.sentToday}           sub="Replies delivered"   color="pink"    />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <StatCard icon={MessageSquare} label="Total Events"      value={stats.totalEvents}             color="blue"    />
            <StatCard icon={UserCheck}     label="Connection Rate"   value={`${connectionRate}%`}          sub="Users with Instagram"  color="amber"   />
            <StatCard icon={TrendingUp}    label="Events Today"      value={stats.eventsToday}             sub="All interactions"      color="emerald" />
          </div>
        </section>

        {/* Interaction Breakdown */}
        {stats.eventsByType.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Interaction Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.eventsByType.map((e) => (
                <div key={e._id} className="bg-white border border-slate-200 rounded-2xl px-4 py-4 flex flex-col gap-2 shadow-sm">
                  <EventTypeBadge type={e._id} />
                  <span className="text-2xl font-black text-slate-900">{e.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Users Table */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Registered Users ({stats.users.length})
            </h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm">
            {stats.users.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm font-medium">No users registered yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Automation</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keywords</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.map((user, i) => (
                    <tr key={user._id} className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${i === stats.users.length - 1 ? "border-0" : ""}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-[13px]">{user.name || "—"}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{user.email || user.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isConnected ? (
                          <div className="flex items-center gap-3">
                            {user.instagramProfilePic && (
                              <img src={user.instagramProfilePic} alt="" className="w-7 h-7 rounded-full border border-slate-200 object-cover" />
                            )}
                            <div>
                              <p className="font-bold text-slate-900 text-[13px]">@{user.instagramUsername}</p>
                              <p className="text-[10px] text-slate-400">{user.instagramBusinessId}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Not connected</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge active={user.automation?.isActive} />
                      </td>
                      <td className="px-6 py-4">
                        {user.automation?.keywords?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.automation.keywords.slice(0, 3).map((k) => (
                              <span key={k} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-mono border border-slate-200">{k}</span>
                            ))}
                            {user.automation.keywords.length > 3 && (
                              <span className="text-slate-400 text-[10px]">+{user.automation.keywords.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">Any</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
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
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
            Recent Events ({stats.recentEvents.length})
          </h2>
          <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm">
            {stats.recentEvents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm font-medium">No events recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">From</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Content</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reply Sent</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEvents.map((event, i) => (
                    <tr key={event._id} className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${i === stats.recentEvents.length - 1 ? "border-0" : ""}`}>
                      <td className="px-6 py-4">
                        <EventTypeBadge type={event.type} />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-700 text-[13px]">
                          {event.from?.username ? `@${event.from.username}` : event.from?.id || "—"}
                        </p>
                        {event.from?.name && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{event.from.name}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-slate-500 text-xs truncate">{event.content?.text || "—"}</p>
                      </td>
                      <td className="px-6 py-4 max-w-[180px]">
                        <p className="text-slate-400 text-xs truncate">{event.reply?.privateDM || event.reply?.publicReply || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <EventStatusBadge status={event.reply?.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-xs">{timeAgo(event.createdAt)}</span>
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
