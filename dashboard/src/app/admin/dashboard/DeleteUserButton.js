"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/app/admin/actions";

export default function DeleteUserButton({ userId }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("userId", userId);
    await deleteUser(fd);
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
        title="Delete user"
      >
        <Trash2 size={13} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-rose-400 font-bold whitespace-nowrap">Delete?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold hover:bg-rose-500/30 transition-all disabled:opacity-60"
      >
        {loading ? "..." : "Yes"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="px-2 py-0.5 bg-slate-800 text-slate-500 border border-slate-700 rounded text-[10px] font-bold hover:bg-slate-700 transition-all"
      >
        No
      </button>
    </div>
  );
}
