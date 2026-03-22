"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Instagram, Loader2, MessageSquare, Users, Zap } from "lucide-react";
import StatCard from "../../components/StatCard";
import PlanBadge from "../../components/PlanBadge";
import ToggleSwitch from "../../components/ToggleSwitch";
import ConfirmModal from "../../components/ConfirmModal";
import EventLog from "../../components/EventLog";
import { adminGetAccountDetail, adminToggleFeature, adminGetFeatureEvents } from "../../admin-actions";

const FEATURE_FLAGS = [
  { key: "aiProductDetectionUnlocked", label: "AI Product Detection", group: "AI" },
  { key: "shopifyEnabled", label: "Shopify Integration", group: "AI" },
  { key: "knowledgeBaseEnabled", label: "Knowledge Base", group: "AI" },
  { key: "smartRepliesEnabled", label: "Smart Replies", group: "AI" },
];

export default function AccountDetailPage() {
  const params = useParams();
  const userId = params.userId;
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmFlag, setConfirmFlag] = useState(null);
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [detail, eventsRes] = await Promise.all([
        adminGetAccountDetail(userId),
        adminGetFeatureEvents("all", 1, 50),
      ]);
      setData(detail);
      // Filter events for this user's accounts
      const acctIds = (detail.igAccounts || []).map((a) => a._id);
      const userEvents = (eventsRes.events || []).filter(
        (e) => acctIds.includes(e.accountId) || e.from?.id === userId
      );
      setEvents(userEvents.length > 0 ? userEvents : eventsRes.events?.slice(0, 10) || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const handleToggle = async () => {
    if (!confirmFlag) return;
    setToggling(true);
    const currentValue = !!data.user?.flags?.[confirmFlag.key];
    await adminToggleFeature(userId, confirmFlag.key, !currentValue);
    setConfirmFlag(null);
    setToggling(false);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#94A3B8" }} /></div>;
  }

  if (!data?.user) {
    return <p className="py-20 text-center text-sm" style={{ color: "#94A3B8" }}>User not found</p>;
  }

  const user = data.user;
  const igAccounts = data.igAccounts || [];

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link href="/admin/accounts" className="flex items-center gap-1.5 text-sm font-medium mb-4"
          style={{ color: "#4338CA" }}>
          <ArrowLeft size={14} /> All accounts
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: "#EEF2FF", color: "#4338CA" }}>
            {(user.instagramUsername || user.userId || "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>
                {user.instagramUsername ? `@${user.instagramUsername}` : user.userId}
              </h1>
              <PlanBadge plan={user.subscription?.plan || "early_access"} />
            </div>
            {user.email && <p className="text-sm" style={{ color: "#64748B" }}>{user.email}</p>}
            <p className="text-xs" style={{ color: "#94A3B8" }}>Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Instagram accounts */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0F172A" }}>Instagram accounts ({igAccounts.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {igAccounts.map((ig) => (
            <div key={ig._id} className="rounded-lg p-4 flex items-center gap-3"
              style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#F1F5F9" }}>
                <Instagram size={18} style={{ color: "#64748B" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "#0F172A" }}>@{ig.instagramUsername || ig.instagramUserId}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {ig.isPrimary && <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded" style={{ background: "#EEF2FF", color: "#4338CA" }}>Primary</span>}
                  <span className="text-[10px]" style={{ color: ig.tokenExpired ? "#DC2626" : "#059669" }}>
                    {ig.tokenExpired ? "Token expired" : "Connected"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {igAccounts.length === 0 && (
            <p className="text-sm py-4" style={{ color: "#94A3B8" }}>No Instagram accounts connected</p>
          )}
        </div>
      </div>

      {/* Feature flags */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0F172A" }}>Feature flags</h2>
        <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
          {FEATURE_FLAGS.map((flag) => {
            const isOn = !!user.flags?.[flag.key];
            return (
              <div key={flag.key} className="flex items-center justify-between px-5 py-3.5"
                style={{ borderTop: "1px solid #F1F5F9" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0F172A" }}>{flag.label}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{flag.group} feature</p>
                </div>
                <ToggleSwitch enabled={isOn} onChange={() => setConfirmFlag(flag)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage stats */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0F172A" }}>Usage</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="DMs this month" value={user.usage?.dmsSentThisMonth || 0} icon={MessageSquare} />
          <StatCard label="DMs total" value={user.usage?.dmsSentTotal || 0} icon={MessageSquare} />
          <StatCard label="AI detections" value={user.usage?.aiDetectionsTotal || 0} icon={Zap} />
          <StatCard label="Total events" value={data.eventCount || 0} icon={Users} />
        </div>
      </div>

      {/* Automation config */}
      {user.automation && (
        <div>
          <h2 className="text-base font-semibold mb-3" style={{ color: "#0F172A" }}>Automation config</h2>
          <div className="rounded-lg p-5 space-y-2" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#64748B" }}>Active</span>
              <span className="font-medium" style={{ color: user.automation.isActive ? "#059669" : "#94A3B8" }}>
                {user.automation.isActive ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#64748B" }}>Comment trigger</span>
              <span style={{ color: "#0F172A" }}>{user.automation.commentTrigger}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#64748B" }}>Keywords</span>
              <span style={{ color: "#0F172A" }}>{user.automation.keywords?.join(", ") || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#64748B" }}>Reel share enabled</span>
              <span style={{ color: "#0F172A" }}>{user.automation.reelShareEnabled ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#64748B" }}>Mentions enabled</span>
              <span style={{ color: "#0F172A" }}>{user.automation.mentionsEnabled ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#64748B" }}>Follower gate</span>
              <span style={{ color: "#0F172A" }}>{user.automation.requireFollow ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0F172A" }}>Recent activity</h2>
        <EventLog events={events} emptyMessage="No events for this account" />
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={!!confirmFlag}
        onClose={() => setConfirmFlag(null)}
        onConfirm={handleToggle}
        title={`${user.flags?.[confirmFlag?.key] ? "Disable" : "Enable"} ${confirmFlag?.label}`}
        description={`${user.flags?.[confirmFlag?.key] ? "Disable" : "Enable"} ${confirmFlag?.label} for ${user.instagramUsername ? "@" + user.instagramUsername : user.userId}?`}
        confirmLabel={user.flags?.[confirmFlag?.key] ? "Disable" : "Enable"}
        confirmColor={user.flags?.[confirmFlag?.key] ? "danger" : "success"}
        loading={toggling}
      />
    </div>
  );
}
