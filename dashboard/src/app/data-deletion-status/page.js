import { CheckCircle2, Trash2 } from "lucide-react";

export default async function DataDeletionStatus({ searchParams }) {
  const params = await searchParams;
  const confirmationCode = params?.id || "";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="text-emerald-400" size={30} />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white tracking-tight">Data Deletion Request</h1>
          <p className="text-slate-400 font-medium leading-relaxed">
            Your data deletion request has been received and processed. All personal data associated with your account has been permanently removed from our systems.
          </p>
        </div>

        {confirmationCode && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmation Code</p>
            <p className="font-mono text-emerald-400 text-sm break-all">{confirmationCode}</p>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-slate-500" />
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">What was deleted</p>
          </div>
          <ul className="space-y-2">
            {[
              "Account profile and credentials",
              "Connected Instagram account tokens",
              "All recorded events and messages",
              "Automation configurations",
              "Any stored contact identifiers",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-slate-600 text-xs">
          Ai DM Bot · If you have questions contact us at support@aidmbot.com
        </p>
      </div>
    </div>
  );
}
