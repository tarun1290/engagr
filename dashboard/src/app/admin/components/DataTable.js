"use client";

import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({ columns, data = [], searchPlaceholder = "Search...", searchKey, pageSize = 20, emptyMessage = "No data", headerActions }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = data;
    if (search && searchKey) {
      const q = search.toLowerCase();
      result = result.filter((row) => {
        const val = row[searchKey];
        return val && String(val).toLowerCase().includes(q);
      });
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return result;
  }, [data, search, searchKey, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #F0F0F0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b" style={{ borderColor: "#F4F4F5" }}>
        {searchKey ? (
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#A1A1AA" }} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all"
              style={{ border: "1px solid #E4E4E7", color: "#18181B" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#4F46E5"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(79,70,229,0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E4E4E7"; e.currentTarget.style.boxShadow = "none"; }} />
          </div>
        ) : <div />}
        {headerActions}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#FAFAFA" }}>
              {columns.map((col) => (
                <th key={col.key}
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${col.sortable ? "cursor-pointer select-none" : ""}`}
                  style={{ color: "#A1A1AA", textAlign: col.align || "left", width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-sm" style={{ color: "#A1A1AA" }}>{emptyMessage}</td></tr>
            ) : paginated.map((row, i) => (
              <tr key={row._id || row.id || i} className="transition-colors"
                style={{ borderTop: "1px solid #F4F4F5" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250,250,250,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5" style={{ textAlign: col.align || "left", color: "#52525B" }}>
                    {col.render ? col.render(row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F4F4F5" }}>
          <span className="text-xs" style={{ color: "#A1A1AA" }}>{filtered.length} results — Page {page}/{totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-1.5 rounded disabled:opacity-30" style={{ color: "#71717A" }}><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="p-1.5 rounded disabled:opacity-30" style={{ color: "#71717A" }}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
