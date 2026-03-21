"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteUser } from "@/app/admin/actions";

export default function DeleteUserButton({ userId }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteUser(userId);
      if (result?.success) {
        router.refresh();
      } else {
        setError(result?.error || "Delete failed");
        setLoading(false);
        setConfirming(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setConfirming(false);
    }
  };

  if (error) {
    return (
      <span className="text-[10px] font-medium" style={{ color: 'var(--error)' }}>{error}</span>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 rounded-lg transition-all"
        style={{ color: 'var(--admin-text-muted)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.backgroundColor = 'var(--error-light)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        title="Delete user"
      >
        <Trash2 size={13} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: 'var(--error)' }}>Delete?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-2 py-0.5 rounded text-[10px] font-bold transition-all disabled:opacity-60"
        style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error-light)' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        {loading ? "..." : "Yes"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={loading}
        className="px-2 py-0.5 rounded text-[10px] font-bold transition-all disabled:opacity-40"
        style={{ backgroundColor: 'var(--admin-card)', color: 'var(--admin-text-muted)', border: '1px solid var(--admin-border)' }}
      >
        No
      </button>
    </div>
  );
}
