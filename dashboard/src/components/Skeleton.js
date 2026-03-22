"use client";

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-xl p-5 ${className}`} style={{ background: "#fff", border: "1px solid #F0F0F0" }}>
      <div className="h-3 rounded w-1/3 mb-3" style={{ background: "#F4F4F5" }} />
      <div className="h-7 rounded w-1/2 mb-2" style={{ background: "#F4F4F5" }} />
      <div className="h-3 rounded w-1/4" style={{ background: "#FAFAFA" }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #F0F0F0" }}>
      <div className="h-10" style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5" style={{ borderBottom: i < rows - 1 ? "1px solid #FAFAFA" : "none" }}>
          <div className="h-4 rounded w-1/4" style={{ background: "#F4F4F5" }} />
          <div className="h-4 rounded w-1/3" style={{ background: "#FAFAFA" }} />
          <div className="h-4 rounded w-1/6" style={{ background: "#F4F4F5" }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 280 }) {
  return (
    <div className="animate-pulse rounded-xl p-5" style={{ background: "#fff", border: "1px solid #F0F0F0" }}>
      <div className="h-3 rounded w-1/4 mb-4" style={{ background: "#F4F4F5" }} />
      <div className="rounded" style={{ height, background: "#FAFAFA" }} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 rounded w-32 animate-pulse" style={{ background: "#F4F4F5" }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonTable />
    </div>
  );
}
