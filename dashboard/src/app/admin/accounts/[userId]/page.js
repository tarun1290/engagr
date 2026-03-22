"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Instagram, Loader2, MessageSquare, Users, Zap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import StatCard from "../../components/StatCard";
import PlanBadge from "../../components/PlanBadge";
import ToggleSwitch from "../../components/ToggleSwitch";
import ConfirmModal from "../../components/ConfirmModal";
import { deleteUser } from "../../actions";
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
  const router = useRouter();
  const userId = params.userId;
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmFlag, setConfirmFlag] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#A1A1AA" }} /></div>;
  }

  if (!data?.user) {
    return <p className="py-20 text-center text-sm" style={{ color: "#A1A1AA" }}>User not found</p>;
  }

  const user = data.user;
  const igAccounts = data.igAccounts || [];

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link href="/admin/accounts" className="flex items-center gap-1.5 text-sm font-medium mb-4"
          style={{ color: "#4F46E5" }}>
          <ArrowLeft size={14} /> All accounts
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: "#EEF2FF", color: "#4F46E5" }}>
            {(user.instagramUsername || user.userId || "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "#18181B" }}>
                {user.instagramUsername ? `@${user.instagramUsername}` : user.userId}
              </h1>
              <PlanBadge plan={user.subscription?.plan || "early_access"} />
            </div>
            {user.email && <p className="text-sm" style={{ color: "#52525B" }}>{user.email}</p>}
            <p className="text-xs" style={{ color: "#A1A1AA" }}>Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Instagram accounts */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#18181B" }}>Instagram accounts ({igAccounts.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {igAccounts.map((ig) => (
            <div key={ig._id} className="rounded-lg p-4 flex items-center gap-3"
              style={{ background: "#fff", border: "1px solid #E4E4E7" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#F4F4F5" }}>
                <Instagram size={18} style={{ color: "#52525B" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "#18181B" }}>@{ig.instagramUsername || ig.instagramUserId}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {ig.isPrimary && <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded" style={{ background: "#EEF2FF", color: "#4F46E5" }}>Primary</span>}
                  <span className="text-[10px]" style={{ color: ig.tokenExpired ? "#DC2626" : "#059669" }}>
                    {ig.tokenExpired ? "Token expired" : "Connected"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {igAccounts.length === 0 && (
            <p className="text-sm py-4" style={{ color: "#A1A1AA" }}>No Instagram accounts connected</p>
          )}
        </div>
      </div>

      {/* Feature flags */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#18181B" }}>Feature flags</h2>
        <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #E4E4E7" }}>
          {FEATURE_FLAGS.map((flag) => {
            const isOn = !!user.flags?.[flag.key];
            return (
              <div key={flag.key} className="flex items-center justify-between px-5 py-3.5"
                style={{ borderTop: "1px solid #F4F4F5" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#18181B" }}>{flag.label}</p>
                  <p className="text-xs" style={{ color: "#A1A1AA" }}>{flag.group} feature</p>
                </div>
                <ToggleSwitch enabled={isOn} onChange={() => setConfirmFlag(flag)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage stats */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#18181B" }}>Usage</h2>
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
          <h2 className="text-base font-semibold mb-3" style={{ color: "#18181B" }}>Automation config</h2>
          <div className="rounded-lg p-5 space-y-2" style={{ background: "#fff", border: "1px solid #E4E4E7" }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#52525B" }}>Active</span>
              <span className="font-medium" style={{ color: user.automation.isActive ? "#059669" : "#A1A1AA" }}>
                {user.automation.isActive ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#52525B" }}>Comment trigger</span>
              <span style={{ color: "#18181B" }}>{user.automation.commentTrigger}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#52525B" }}>Keywords</span>
              <span style={{ color: "#18181B" }}>{user.automation.keywords?.join(", ") || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#52525B" }}>Reel share enabled</span>
              <span style={{ color: "#18181B" }}>{user.automation.reelShareEnabled ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#52525B" }}>Mentions enabled</span>
              <span style={{ color: "#18181B" }}>{user.automation.mentionsEnabled ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#52525B" }}>Follower gate</span>
              <span style={{ color: "#18181B" }}>{user.automation.requireFollow ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#18181B" }}>Recent activity</h2>
        <EventLog events={events} emptyMessage="No events for this account" />
      </div>

      {/* Danger zone */}
      <div className="rounded-xl p-6" style={{ border: "2px solid #FCA5A5", background: "#FEF2F2" }}>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "#DC2626" }}>Danger zone</h2>
        <p className="text-xs mb-4" style={{ color: "#991B1B" }}>
          Permanently delete this account and all associated data. This cannot be undone.
        </p>
        <button onClick={() => setShowDelete(true)}
          className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg text-white"
          style={{ background: "#DC2626" }}>
          <Trash2 size={13} /> Delete account
        </button>
      </div>

      {/* Feature toggle confirm modal */}
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

      {/* Delete account confirm modal */}
      <ConfirmModal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteConfirmText(""); }}
        onConfirm={async () => {
          setDeleting(true);
          const res = await deleteUser(user.userId, deleteConfirmText);
          if (res.success) {
            toast.success(`Account deleted. ${res.deleted.events} events, ${res.deleted.igAccounts} accounts removed.`);
            router.push("/admin/accounts");
          } else {
            toast.error(res.error || "Failed to delete");
          }
          setDeleting(false);
        }}
        title={`Delete @${user.instagramUsername || user.userId}?`}
        description="This permanently deletes the account and ALL data: events, contacts, automations, connected accounts."
        confirmLabel="Delete account"
        confirmColor="danger"
        loading={deleting}
      >
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "#A1A1AA" }}>
            Type <strong style={{ color: "#18181B" }}>{user.instagramUsername || user.email || user.userId}</strong> to confirm:
          </p>
          <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type to confirm..."
            className="w-full px-3 py-2 text-sm rounded-lg outline-none"
            style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
        </div>
      </ConfirmModal>
    </div>
  );
}
