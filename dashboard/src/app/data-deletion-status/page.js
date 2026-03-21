import { CheckCircle2, Trash2 } from "lucide-react";

export default async function DataDeletionStatus({ searchParams }) {
  const params = await searchParams;
  const confirmationCode = params?.id || "";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 theme-transition"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="w-full max-w-lg space-y-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success-light)' }}
        >
          <CheckCircle2 size={30} style={{ color: 'var(--success)' }} />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Data Deletion Request</h1>
          <p className="font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your data deletion request has been received and processed. All personal data associated with your account has been permanently removed from our systems.
          </p>
        </div>

        {confirmationCode && (
          <div
            className="rounded-2xl p-6 text-left space-y-2"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Confirmation Code</p>
            <p className="font-mono text-sm break-all" style={{ color: 'var(--success)' }}>{confirmationCode}</p>
          </div>
        )}

        <div
          className="rounded-2xl p-6 text-left space-y-4"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Trash2 size={16} style={{ color: 'var(--text-placeholder)' }} />
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>What was deleted</p>
          </div>
          <ul className="space-y-2">
            {[
              "Account profile and credentials",
              "Connected Instagram account tokens",
              "All recorded events and messages",
              "Automation configurations",
              "Any stored contact identifiers",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--success)' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Engagr · If you have questions contact us at support@engagr.app
        </p>
      </div>
    </div>
  );
}
