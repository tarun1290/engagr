const STYLES = {
  early_access: { bg: "#EEF2FF", color: "#4338CA", label: "Early Access" },
  trial: { bg: "#EEF2FF", color: "#4338CA", label: "Trial" },
  silver: { bg: "#F4F4F5", color: "#52525B", label: "Silver" },
  gold: { bg: "#FFFBEB", color: "#92400E", label: "Gold" },
  platinum: { bg: "#EEF2FF", color: "#4338CA", label: "Platinum" },
};

export default function PlanBadge({ plan }) {
  const s = STYLES[plan] || STYLES.early_access;
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}
