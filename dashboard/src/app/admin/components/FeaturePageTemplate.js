"use client";

import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import StatusBadge from "./StatusBadge";
import ChartCard from "./ChartCard";
import EventLog from "./EventLog";
import AccountFeatureTable from "./AccountFeatureTable";
import { adminGetFeatureStats, adminGetFeatureEvents, adminGetFeatureAccounts, adminToggleFeature } from "../admin-actions";

/**
 * Shared layout for ALL /admin/features/* pages.
 *
 * @param {{
 *   feature: string,
 *   title: string,
 *   description: string,
 *   codeTag?: string,
 *   codeStatus: 'live' | 'disabled' | 'planned',
 *   roadmapDate?: string,
 *   stats: Array<{ key: string, label: string, icon: any, format?: string }>,
 *   accountStatColumn?: { key: string, label: string },
 *   featureFlag: string,
 *   extraContent?: React.ReactNode,
 * }} props
 */
export default function FeaturePageTemplate({
  feature, title, description, codeTag, codeStatus, roadmapDate,
  stats: statConfig = [], accountStatColumn, featureFlag, extraContent,
}) {
  const [statsData, setStatsData] = useState({});
  const [events, setEvents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, eventsRes, accountsRes] = await Promise.all([
          adminGetFeatureStats(feature),
          adminGetFeatureEvents(feature),
          adminGetFeatureAccounts(feature),
        ]);
        if (statsRes && !statsRes.error) setStatsData(statsRes);
        if (eventsRes && !eventsRes.error) setEvents(eventsRes.events || []);
        if (accountsRes && !accountsRes.error) setAccounts(accountsRes.accounts || []);
      } catch (e) {
        console.error("[FeaturePage] Load error:", e.message);
      }
      setLoading(false);
    }
    load();
  }, [feature]);

  const handleToggle = async (userId, enabled) => {
    const res = await adminToggleFeature(userId, featureFlag, enabled);
    if (res?.success) {
      // Refresh accounts
      const accountsRes = await adminGetFeatureAccounts(feature);
      if (accountsRes && !accountsRes.error) setAccounts(accountsRes.accounts || []);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold" style={{ color: "#18181B" }}>{title}</h1>
            <StatusBadge status={codeStatus} />
          </div>
          <p className="text-sm" style={{ color: "#52525B" }}>{description}</p>
          {codeTag && (
            <p className="text-xs mt-1 font-mono" style={{ color: "#A1A1AA" }}>Code tag: {codeTag}</p>
          )}
          {roadmapDate && codeStatus !== "live" && (
            <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>Expected: {roadmapDate}</p>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {statConfig.length > 0 && (
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(statConfig.length, 4)}, 1fr)` }}>
          {statConfig.map((s) => (
            <StatCard
              key={s.key}
              label={s.label}
              value={statsData[s.key] ?? 0}
              icon={s.icon}
              format={s.format}
              trend={statsData[`${s.key}Trend`]}
            />
          ))}
        </div>
      )}

      {/* Charts placeholder */}
      <ChartCard title={`${title} activity`} isEmpty={events.length === 0}
        emptyMessage="No activity data" emptySubtext={codeStatus !== "live" ? "Feature is not active yet." : "Events will appear here."}>
        {events.length > 0 && (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: "#A1A1AA" }}>
            Chart renders here with Recharts when data is available
          </div>
        )}
      </ChartCard>

      {/* Event log */}
      <EventLog events={events} loading={loading} emptyMessage={`No ${feature} events yet`} />

      {/* Extra content */}
      {extraContent}

      {/* Account table */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#18181B" }}>Account access</h2>
        <AccountFeatureTable
          featureName={title}
          featureFlag={featureFlag}
          codeStatus={codeStatus}
          accountStatColumn={accountStatColumn}
          accounts={accounts}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
