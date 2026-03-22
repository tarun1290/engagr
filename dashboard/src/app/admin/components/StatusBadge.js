const STYLES = {
  live: { bg: "#ECFDF5", color: "#065F46", label: "Live" },
  disabled: { bg: "#FFFBEB", color: "#92400E", label: "Disabled" },
  planned: { bg: "#F4F4F5", color: "#52525B", label: "Planned" },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.planned;
  return (
    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}
