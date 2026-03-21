"use client";

import { cn } from "@/lib/utils";

const DM_PRESETS = [
  {
    label: "Friendly",
    emoji: "😊",
    preview: "Hey there! Thanks so much for your interest 😊",
    full: "Hey there! Thanks so much for your interest 😊\n\nClick below and I'll send you the link right away ✨",
  },
  {
    label: "Casual",
    emoji: "👋",
    preview: "Hey! Saw your comment and wanted to reach out",
    full: "Hey! 👋 Saw your comment and wanted to reach out personally.\n\nHere's what you asked for 👇",
  },
  {
    label: "Excited",
    emoji: "🎉",
    preview: "Yay! So happy you're interested",
    full: "Yay! So happy you're here 🎉\n\nI've got something special for you — tap below to grab it!",
  },
  {
    label: "Professional",
    emoji: "📋",
    preview: "Hi! Thanks for reaching out.",
    full: "Hi! Thanks for reaching out.\n\nPlease find the information you requested via the link below.",
  },
  {
    label: "Hype",
    emoji: "🔥",
    preview: "You caught this just in time!",
    full: "You caught this just in time 🔥\n\nTap below before it's gone — I'll send it straight to you!",
  },
  {
    label: "Warm",
    emoji: "💕",
    preview: "Means the world that you're here!",
    full: "It means the world that you're here 💕\n\nI've put something together just for you — check it out below 👇",
  },
];

export default function ResponseEditor({
  dmContent, setDmContent,
  buttonText, setButtonText,
  linkUrl, setLinkUrl
}) {
  const selectedPreset = DM_PRESETS.find(p => p.full === dmContent);

  return (
    <div className="space-y-8">

      {/* DM message */}
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Opening DM</label>
          <p className="text-[12px] text-slate-400 mt-0.5">Sent privately when someone triggers the automation.</p>
        </div>

        {/* Preset templates */}
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            Templates — click to use
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DM_PRESETS.map((preset) => {
              const isSelected = dmContent === preset.full;
              return (
                <button
                  key={preset.label}
                  onClick={() => setDmContent(preset.full)}
                  className={cn(
                    "text-left px-4 py-3 rounded-2xl border transition-all",
                    isSelected
                      ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                      : "bg-white border-slate-200 hover:border-primary/20 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{preset.emoji}</span>
                    <span className={cn("text-[12px] font-black uppercase tracking-wide", isSelected ? "text-primary" : "text-slate-700")}>
                      {preset.label}
                    </span>
                    {isSelected && (
                      <span className="ml-auto text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug truncate">{preset.preview}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea — always editable */}
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {selectedPreset ? `Editing "${selectedPreset.label}" template` : "Custom message"}
          </p>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[110px] leading-relaxed resize-none"
            value={dmContent}
            onChange={(e) => setDmContent(e.target.value)}
            placeholder="Write your auto-DM message here..."
          />
          <p className="text-[11px] text-slate-300 mt-1">You can edit any template above or write your own here.</p>
        </div>
      </div>

      {/* Link (optional) */}
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Link <span className="text-slate-300 font-medium normal-case tracking-normal">(optional)</span>
          </label>
          <p className="text-[12px] text-slate-400 mt-0.5">Included in the DM message below the text.</p>
        </div>
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://yourlink.com"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl h-11 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-primary"
        />
      </div>

      {/* Button label */}
      {linkUrl && (
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Button Label</label>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="e.g. Get the link, Grab it here"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl h-11 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      )}

    </div>
  );
}
