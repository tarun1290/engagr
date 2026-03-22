"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import ToggleSwitch from "../components/ToggleSwitch";
import { adminGetPlanConfig, adminUpdatePlanConfig } from "../admin-actions";
import { FEATURE_DISPLAY_NAMES, COMING_SOON_FEATURES } from "@/lib/featureNames";

const ACCOUNT_TYPES = [
  { key: "creator", label: "Creator", emoji: "\uD83C\uDFA8", color: "#9333EA", bg: "#F3E8FF" },
  { key: "business", label: "Business", emoji: "\uD83C\uDFEA", color: "#4F46E5", bg: "#EEF2FF" },
  { key: "agency", label: "Agency", emoji: "\uD83C\uDFE2", color: "#D97706", bg: "#FFFBEB" },
];

function SectionCard({ title, badge, badgeColor, disabled, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: "#fff",
      border: disabled ? "1px solid #FDE68A" : "1px solid #F0F0F0",
      opacity: disabled ? 0.6 : 1,
    }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid #F4F4F5" }}>
        <h2 className="text-sm font-semibold" style={{ color: "#18181B" }}>{title}</h2>
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
            background: badgeColor === "amber" ? "#FFFBEB" : "#ECFDF5",
            color: badgeColor === "amber" ? "#92400E" : "#065F46",
          }}>{badge}</span>
        )}
      </div>
      <div className="p-6" style={{ pointerEvents: disabled ? "none" : "auto" }}>{children}</div>
    </div>
  );
}

function NumberInput({ label, value, onChange, disabled, min, max, prefix, suffix }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: "#71717A" }}>{label}</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm" style={{ color: "#A1A1AA" }}>{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled}
          min={min} max={max}
          className="w-full px-3 py-2 text-sm rounded-lg outline-none"
          style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
        {suffix && <span className="text-xs" style={{ color: "#A1A1AA" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, disabled, placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: "#71717A" }}>{label}</label>
      <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg outline-none"
        style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
    </div>
  );
}

export default function PlansPage() {
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("creator");

  useEffect(() => {
    adminGetPlanConfig().then((c) => {
      setConfig(c);
      setOriginalConfig(JSON.parse(JSON.stringify(c)));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !config) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: "#A1A1AA" }} /></div>;
  }

  const typePlans = config.plans?.[activeType] || {};
  const planSlugs = Object.keys(typePlans);
  const typeInfo = ACCOUNT_TYPES.find((t) => t.key === activeType);

  const updatePlan = (slug, field, value) => {
    setConfig((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [activeType]: {
          ...prev.plans[activeType],
          [slug]: { ...prev.plans[activeType][slug], [field]: value },
        },
      },
    }));
  };

  const updateFeature = (slug, feature, value) => {
    setConfig((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [activeType]: {
          ...prev.plans[activeType],
          [slug]: {
            ...prev.plans[activeType][slug],
            features: { ...prev.plans[activeType][slug].features, [feature]: value },
          },
        },
      },
    }));
  };

  const updateEarlyAccess = (field, value) => {
    setConfig((prev) => ({ ...prev, earlyAccess: { ...prev.earlyAccess, [field]: value } }));
  };

  const updateDisplay = (field, value) => {
    setConfig((prev) => ({ ...prev, display: { ...prev.display, [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await adminUpdatePlanConfig(config);
    if (result.error) { toast.error(result.error); setSaving(false); return; }
    // Check for price changes across all types
    let priceChanged = false;
    for (const type of ["creator", "business", "agency"]) {
      for (const slug of Object.keys(config.plans?.[type] || {})) {
        if (config.plans?.[type]?.[slug]?.price !== originalConfig?.plans?.[type]?.[slug]?.price) {
          priceChanged = true;
          break;
        }
      }
      if (priceChanged) break;
    }
    if (priceChanged) toast.warning("Price changes only affect new subscriptions.");
    toast.success("Plan configuration updated. Changes are live.");
    setOriginalConfig(JSON.parse(JSON.stringify(config)));
    setSaving(false);
  };

  const sym = config.display?.currencySymbol || "\u20B9";

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#18181B" }}>Plan configuration</h1>
        <p className="text-sm" style={{ color: "#71717A" }}>Changes apply across the app within 5 minutes</p>
        {config.updatedAt && (
          <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
            Last updated: {new Date(config.updatedAt).toLocaleString()} by {config.updatedBy || "system"}
          </p>
        )}
      </div>

      {/* Account type tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F4F4F5" }}>
        {ACCOUNT_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => setActiveType(type.key)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeType === type.key ? "#FFFFFF" : "transparent",
              color: activeType === type.key ? type.color : "#71717A",
              boxShadow: activeType === type.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <span>{type.emoji}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Plan cards for active type */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "#18181B" }}>
            {typeInfo?.label} plans
          </h2>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: typeInfo?.bg, color: typeInfo?.color }}>
            {planSlugs.length} tiers
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {planSlugs.map((slug) => {
            const plan = typePlans[slug];
            if (!plan) return null;
            return (
              <div key={slug} className="rounded-xl p-6 space-y-4" style={{
                background: "#fff",
                border: plan.isPopular ? `2px solid ${typeInfo?.color}33` : "1px solid #F0F0F0",
              }}>
                <div className="flex items-center justify-between">
                  <TextInput label="Plan name" value={plan.name} onChange={(v) => updatePlan(slug, "name", v)} />
                  {plan.isPopular && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: typeInfo?.bg, color: typeInfo?.color }}>Popular</span>
                  )}
                </div>
                <div className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "#F9FAFB", color: "#A1A1AA" }}>
                  {plan.slug}
                </div>
                <NumberInput label="Price" value={plan.price} onChange={(v) => updatePlan(slug, "price", v)} prefix={sym} min={1} suffix="/mo" />
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#71717A" }}>DM limit</label>
                  <div className="flex items-center gap-3">
                    <input type="number" value={plan.dmLimit === -1 ? "" : plan.dmLimit}
                      onChange={(e) => updatePlan(slug, "dmLimit", Number(e.target.value))}
                      disabled={plan.dmLimit === -1}
                      className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                      style={{ border: "1px solid #E4E4E7", color: "#18181B", opacity: plan.dmLimit === -1 ? 0.4 : 1 }} />
                    <label className="flex items-center gap-1.5 text-xs whitespace-nowrap" style={{ color: "#71717A" }}>
                      <input type="checkbox" checked={plan.dmLimit === -1}
                        onChange={(e) => updatePlan(slug, "dmLimit", e.target.checked ? -1 : 10000)}
                        style={{ accentColor: typeInfo?.color }} />
                      Unlimited
                    </label>
                  </div>
                </div>
                <NumberInput label="Max IG accounts" value={plan.maxAccounts} onChange={(v) => updatePlan(slug, "maxAccounts", v)} min={1} max={20} />
                <NumberInput label="Max reel rules" value={plan.maxReelRules} onChange={(v) => updatePlan(slug, "maxReelRules", v)} min={-1} max={50} />
                <NumberInput label="Max knowledge docs" value={plan.maxKnowledgeDocs} onChange={(v) => updatePlan(slug, "maxKnowledgeDocs", v)} min={0} max={50} />
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#71717A" }}>Support level</label>
                  <select value={plan.supportLevel} onChange={(e) => updatePlan(slug, "supportLevel", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ border: "1px solid #E4E4E7", color: "#18181B" }}>
                    <option value="email">Email</option>
                    <option value="priority">Priority</option>
                    <option value="dedicated">Dedicated</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs" style={{ color: "#71717A" }}>Mark as popular</span>
                  <ToggleSwitch enabled={plan.isPopular} onChange={(v) => {
                    for (const s of planSlugs) { if (s !== slug) updatePlan(s, "isPopular", false); }
                    updatePlan(slug, "isPopular", v);
                  }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#71717A" }}>Visible on pricing</span>
                  <ToggleSwitch enabled={plan.isVisible} onChange={(v) => updatePlan(slug, "isVisible", v)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature matrix for active type */}
      <SectionCard title={`${typeInfo?.label} feature access`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Feature</th>
                {planSlugs.map((s) => (
                  <th key={s} className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>
                    {typePlans[s]?.name || s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(FEATURE_DISPLAY_NAMES).map(([key, label], i) => (
                <tr key={key} style={{ background: i % 2 ? "#FAFAFA" : "transparent", borderTop: "1px solid #F4F4F5" }}>
                  <td className="px-4 py-2.5 text-sm" style={{ color: "#18181B" }}>
                    {label}
                    {COMING_SOON_FEATURES.includes(key) && (
                      <span className="ml-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F0FDFA", color: "#0D9488" }}>Soon</span>
                    )}
                  </td>
                  {planSlugs.map((slug) => (
                    <td key={slug} className="text-center px-4 py-2.5">
                      <input type="checkbox" checked={!!typePlans[slug]?.features?.[key]}
                        onChange={(e) => updateFeature(slug, key, e.target.checked)}
                        style={{ accentColor: typeInfo?.color }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Overage billing — disabled */}
      <SectionCard title="Overage billing" badge="Payments disabled" badgeColor="amber" disabled>
        <p className="text-xs" style={{ color: "#A1A1AA" }}>Enable payments to configure overage billing per account type.</p>
      </SectionCard>

      {/* Top-up packs — disabled */}
      <SectionCard title="Top-up packs" badge="Payments disabled" badgeColor="amber" disabled>
        <div className="space-y-2">
          {[{ dms: 200, price: 49 }, { dms: 500, price: 99 }, { dms: 1000, price: 179 }].map((pack) => (
            <div key={pack.dms} className="flex items-center gap-4">
              <span className="text-sm w-16" style={{ color: "#18181B" }}>{pack.dms} DMs</span>
              <span className="text-sm" style={{ color: "#71717A" }}>{sym}{pack.price}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Early access settings */}
      <SectionCard title="Early access">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#18181B" }}>Early access enabled</p>
              <p className="text-xs" style={{ color: "#A1A1AA" }}>When disabled, users must have a paid plan</p>
            </div>
            <ToggleSwitch enabled={config.earlyAccess?.enabled} onChange={(v) => updateEarlyAccess("enabled", v)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#71717A" }}>DM limit</label>
              <div className="flex items-center gap-2">
                <input type="number" value={config.earlyAccess?.dmLimit === -1 ? "" : config.earlyAccess?.dmLimit}
                  onChange={(e) => updateEarlyAccess("dmLimit", Number(e.target.value))}
                  disabled={config.earlyAccess?.dmLimit === -1}
                  className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ border: "1px solid #E4E4E7", color: "#18181B", opacity: config.earlyAccess?.dmLimit === -1 ? 0.4 : 1 }} />
                <label className="flex items-center gap-1 text-xs" style={{ color: "#71717A" }}>
                  <input type="checkbox" checked={config.earlyAccess?.dmLimit === -1}
                    onChange={(e) => updateEarlyAccess("dmLimit", e.target.checked ? -1 : 10000)}
                    style={{ accentColor: "#4F46E5" }} />
                  {"\u221E"}
                </label>
              </div>
            </div>
            <NumberInput label="Max accounts" value={config.earlyAccess?.maxAccounts || 5} onChange={(v) => updateEarlyAccess("maxAccounts", v)} min={1} max={10} />
            <NumberInput label="Max reel rules" value={config.earlyAccess?.maxReelRules || 5} onChange={(v) => updateEarlyAccess("maxReelRules", v)} min={1} max={20} />
          </div>
        </div>
      </SectionCard>

      {/* Display settings */}
      <SectionCard title="Display settings">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Currency symbol" value={config.display?.currencySymbol} onChange={(v) => updateDisplay("currencySymbol", v)} />
            <TextInput label="CTA button text" value={config.display?.ctaText} onChange={(v) => updateDisplay("ctaText", v)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#18181B" }}>Show "Coming soon" badges</span>
            <ToggleSwitch enabled={config.display?.showComingSoonBadges} onChange={(v) => updateDisplay("showComingSoonBadges", v)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#18181B" }}>Show annual pricing toggle</span>
            <ToggleSwitch enabled={config.display?.showAnnualToggle} onChange={(v) => updateDisplay("showAnnualToggle", v)} />
          </div>
          {config.display?.showAnnualToggle && (
            <NumberInput label="Annual discount %" value={config.display?.annualDiscountPercent || 20} onChange={(v) => updateDisplay("annualDiscountPercent", v)} min={0} max={50} suffix="%" />
          )}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#71717A" }}>Early access banner text</label>
            <textarea value={config.display?.earlyAccessBanner || ""} onChange={(e) => updateDisplay("earlyAccessBanner", e.target.value)}
              rows={2} className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
              style={{ border: "1px solid #E4E4E7", color: "#18181B" }} />
          </div>
        </div>
      </SectionCard>

      {/* Dodo product IDs — disabled */}
      <SectionCard title="Dodo product IDs" badge="Payments disabled" badgeColor="amber" disabled>
        <div className="space-y-4">
          {ACCOUNT_TYPES.map((type) => (
            <div key={type.key}>
              <p className="text-xs font-semibold mb-2" style={{ color: type.color }}>{type.emoji} {type.label}</p>
              <div className="space-y-2 pl-4">
                {Object.keys(config.plans?.[type.key] || {}).map((slug) => (
                  <TextInput key={slug} label={`${config.plans?.[type.key]?.[slug]?.name || slug} product ID`}
                    value="" onChange={() => {}} disabled placeholder={`prod_${type.key}_${slug}_xxx`} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "#A1A1AA" }}>Enter Dodo product IDs when payments are enabled.</p>
      </SectionCard>

      {/* Legacy plan mapping */}
      <SectionCard title="Legacy plan mapping">
        <p className="text-xs mb-3" style={{ color: "#A1A1AA" }}>
          Users on old plan slugs (silver, gold, platinum) are mapped to business plans. This mapping is used for DM limit lookups and feature checks.
        </p>
        <div className="space-y-2">
          {[
            { old: "silver", maps: "business_essentials" },
            { old: "gold", maps: "business_professional" },
            { old: "platinum", maps: "business_enterprise" },
          ].map((m) => (
            <div key={m.old} className="flex items-center gap-3 text-sm">
              <span className="font-mono px-2 py-1 rounded" style={{ background: "#F9FAFB", color: "#71717A" }}>{m.old}</span>
              <span style={{ color: "#A1A1AA" }}>{"\u2192"}</span>
              <span className="font-mono px-2 py-1 rounded" style={{ background: "#EEF2FF", color: "#4F46E5" }}>{m.maps}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-40 px-6 py-4" style={{ background: "rgba(250,250,250,0.95)", borderTop: "1px solid #F0F0F0", backdropFilter: "blur(8px)" }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <p className="text-xs" style={{ color: "#A1A1AA" }}>Changes save to database and apply within 5 minutes</p>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: "#4F46E5" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#4338CA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#4F46E5"; }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
