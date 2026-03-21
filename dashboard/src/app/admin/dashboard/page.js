import { ShieldCheck, Users, Zap, MessageSquare, Activity, LogOut, Instagram, TrendingUp, UserCheck, Calendar } from "lucide-react";
import { getAdminStats, adminLogout } from "../actions";
import DeleteUserButton from "./DeleteUserButton";
import AdminThemeToggle from "./AdminThemeToggle";

// Force dynamic rendering — admin dashboard must always show fresh DB data
export const dynamic = "force-dynamic";

function StatCard({ label, value, sub, icon: Icon, color = "slate" }) {
  const colorMap = {
    pink:    { bg: "var(--error-light)",   text: "var(--error)",   border: "var(--error-light)" },
    emerald: { bg: "var(--success-light)", text: "var(--success)", border: "var(--success-light)" },
    blue:    { bg: "var(--info-light)",    text: "var(--info)",    border: "var(--info-light)" },
    amber:   { bg: "var(--warning-light)", text: "var(--warning)", border: "var(--warning-light)" },
    slate:   { bg: "var(--admin-surface-alt)", text: "var(--admin-text-muted)", border: "var(--admin-border)" },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <div
      className="rounded-[20px] p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: "var(--admin-card)", border: `1px solid var(--admin-border)` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-3xl font-black" style={{ color: "var(--admin-text-primary)" }}>{value}</p>
        <p className="text-[13px] font-semibold mt-0.5" style={{ color: "var(--admin-text-muted)" }}>{label}</p>
        {sub && <p className="text-[11px] mt-1" style={{ color: "var(--admin-text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: "var(--success-light)", color: "var(--success)", border: "1px solid var(--success)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--success)" }} /> Active
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: "var(--admin-surface-alt)", color: "var(--admin-text-muted)", border: "1px solid var(--admin-border)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--admin-text-muted)" }} /> Inactive
    </span>
  );
}

function EventTypeBadge({ type }) {
  const map = {
    comment:    { bg: "var(--info-light)",    text: "var(--info)",    border: "var(--info)" },
    mention:    { bg: "var(--primary-light)",  text: "var(--primary)", border: "var(--primary)" },
    dm:         { bg: "var(--error-light)",    text: "var(--error)",   border: "var(--error)" },
    reel_share: { bg: "var(--warning-light)",  text: "var(--warning)", border: "var(--warning)" },
    reaction:   { bg: "var(--error-light)",    text: "var(--error)",   border: "var(--error)" },
    postback:   { bg: "var(--accent-light)",   text: "var(--accent)",  border: "var(--accent)" },
  };
  const fallback = { bg: "var(--admin-surface-alt)", text: "var(--admin-text-muted)", border: "var(--admin-border)" };
  const c = map[type] || fallback;

  return (
    <span
      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {type?.replace("_", " ")}
    </span>
  );
}

function EventStatusBadge({ status }) {
  const map = {
    sent:     { bg: "var(--success-light)", text: "var(--success)", border: "var(--success)" },
    failed:   { bg: "var(--error-light)",   text: "var(--error)",   border: "var(--error)" },
    fallback: { bg: "var(--warning-light)", text: "var(--warning)", border: "var(--warning)" },
    skipped:  { bg: "var(--admin-surface-alt)", text: "var(--admin-text-muted)", border: "var(--admin-border)" },
  };
  const c = map[status] || map.skipped;

  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
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
    <div className="min-h-screen theme-transition" style={{ backgroundColor: "var(--admin-bg)", color: "var(--admin-text-primary)" }}>

      {/* Header */}
      <header
        className="px-8 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur shadow-sm"
        style={{
          backgroundColor: "color-mix(in srgb, var(--admin-card) 90%, transparent)",
          borderBottom: "1px solid var(--admin-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
          >
            <ShieldCheck style={{ color: "var(--primary)" }} size={16} />
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: "var(--admin-text-primary)" }}>Admin Panel</p>
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--admin-text-muted)" }}>Engagr</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminThemeToggle />
          <form action={adminLogout}>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
              style={{
                backgroundColor: "var(--admin-card)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text-muted)",
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">

        {/* Stats Grid */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: "var(--admin-text-muted)" }}>Overview</h2>
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
            <h2 className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: "var(--admin-text-muted)" }}>Interaction Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.eventsByType.map((e) => (
                <div
                  key={e._id}
                  className="rounded-2xl px-4 py-4 flex flex-col gap-2 shadow-sm"
                  style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
                >
                  <EventTypeBadge type={e._id} />
                  <span className="text-2xl font-black" style={{ color: "var(--admin-text-primary)" }}>{e.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Users Table */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>
              Registered Users ({stats.users.length})
            </h2>
          </div>
          <div
            className="rounded-[20px] overflow-hidden shadow-sm"
            style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
          >
            {stats.users.length === 0 ? (
              <div className="py-16 text-center text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>No users registered yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--admin-border)", backgroundColor: "var(--admin-surface-alt)" }}>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>User</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Instagram</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Automation</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Keywords</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Joined</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: "var(--admin-text-muted)" }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.map((user, i) => (
                    <tr
                      key={user._id}
                      className="transition-colors"
                      style={{
                        borderBottom: i === stats.users.length - 1 ? "none" : "1px solid var(--admin-border)",
                      }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-[13px]" style={{ color: "var(--admin-text-primary)" }}>{user.name || "—"}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--admin-text-muted)" }}>{user.email || user.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isConnected ? (
                          <div className="flex items-center gap-3">
                            {user.instagramProfilePic && (
                              <img src={user.instagramProfilePic} alt="" className="w-7 h-7 rounded-full object-cover" style={{ border: "1px solid var(--admin-border)" }} />
                            )}
                            <div>
                              <p className="font-bold text-[13px]" style={{ color: "var(--admin-text-primary)" }}>@{user.instagramUsername}</p>
                              <p className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>{user.instagramBusinessId}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Not connected</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge active={user.automation?.isActive} />
                      </td>
                      <td className="px-6 py-4">
                        {user.automation?.keywords?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.automation.keywords.slice(0, 3).map((k) => (
                              <span
                                key={k}
                                className="px-2 py-0.5 rounded-md text-[10px] font-mono"
                                style={{ backgroundColor: "var(--admin-surface-alt)", color: "var(--admin-text-secondary)", border: "1px solid var(--admin-border)" }}
                              >
                                {k}
                              </span>
                            ))}
                            {user.automation.keywords.length > 3 && (
                              <span className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>+{user.automation.keywords.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Any</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5" style={{ color: "var(--admin-text-muted)" }}>
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
          <h2 className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: "var(--admin-text-muted)" }}>
            Recent Events ({stats.recentEvents.length})
          </h2>
          <div
            className="rounded-[20px] overflow-hidden shadow-sm"
            style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
          >
            {stats.recentEvents.length === 0 ? (
              <div className="py-16 text-center text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>No events recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--admin-border)", backgroundColor: "var(--admin-surface-alt)" }}>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Type</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>From</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Content</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Reply Sent</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Status</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEvents.map((event, i) => (
                    <tr
                      key={event._id}
                      className="transition-colors"
                      style={{
                        borderBottom: i === stats.recentEvents.length - 1 ? "none" : "1px solid var(--admin-border)",
                      }}
                    >
                      <td className="px-6 py-4">
                        <EventTypeBadge type={event.type} />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[13px]" style={{ color: "var(--admin-text-secondary)" }}>
                          {event.from?.username ? `@${event.from.username}` : event.from?.id || "—"}
                        </p>
                        {event.from?.name && (
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--admin-text-muted)" }}>{event.from.name}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-xs truncate" style={{ color: "var(--admin-text-muted)" }}>{event.content?.text || "—"}</p>
                      </td>
                      <td className="px-6 py-4 max-w-[180px]">
                        <p className="text-xs truncate" style={{ color: "var(--admin-text-muted)" }}>{event.reply?.privateDM || event.reply?.publicReply || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <EventStatusBadge status={event.reply?.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{timeAgo(event.createdAt)}</span>
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
