"use client";

import { cn } from "@/lib/utils";

function normalizeUrl(url) {
  if (!url) return '';
  url = url.trim().replace(/\s/g, '');
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  return url;
}

const DM_PRESETS = [
  {
    label: "Friendly",
    emoji: "😊",
    preview: "Hey there! Thanks so much for your interest 😊",
    full: "Hey there! I'm really glad you're here, thank you so much for your interest 😊",
  },
  {
    label: "Casual",
    emoji: "👋",
    preview: "Hey! Saw your comment and wanted to reach out",
    full: "Hey! 👋 Saw your comment and wanted to reach out personally.",
  },
  {
    label: "Excited",
    emoji: "🎉",
    preview: "Yay! So happy you're interested",
    full: "Yay! So happy you're here 🎉\n\nI've got something special for you!",
  },
  {
    label: "Professional",
    emoji: "📋",
    preview: "Hi! Thanks for reaching out.",
    full: "Hi! Thanks for reaching out. I appreciate your interest.",
  },
  {
    label: "Hype",
    emoji: "🔥",
    preview: "You caught this just in time!",
    full: "You caught this just in time 🔥\n\nI've got something you'll love!",
  },
  {
    label: "Warm",
    emoji: "💕",
    preview: "Means the world that you're here!",
    full: "It means the world that you're here 💕\n\nI've put something together just for you!",
  },
];

export default function ResponseEditor({
  dmContent, setDmContent,
  buttonText, setButtonText,
  linkUrl, setLinkUrl,
  deliveryMessage, setDeliveryMessage,
  deliveryButtonText, setDeliveryButtonText,
}) {
  const selectedPreset = DM_PRESETS.find(p => p.full === dmContent);

  return (
    <div className="space-y-10 theme-transition">

      {/* ── Step 1: Initial Greeting DM ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black"
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
          >1</span>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Greeting Message</label>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-placeholder)' }}>The first DM sent when someone comments. Includes a confirmation button.</p>
          </div>
        </div>

        {/* Preset templates */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-placeholder)' }}>
            Templates — click to use
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DM_PRESETS.map((preset) => {
              const isSelected = dmContent === preset.full;
              return (
                <button
                  key={preset.label}
                  onClick={() => setDmContent(preset.full)}
                  className="text-left px-4 py-3 rounded-2xl transition-all"
                  style={
                    isSelected
                      ? { backgroundColor: 'var(--primary-light)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--primary-medium)', boxShadow: '0 0 0 1px var(--primary-medium)' }
                      : { backgroundColor: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }
                  }
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{preset.emoji}</span>
                    <span
                      className="text-[12px] font-black uppercase tracking-wide"
                      style={{ color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}
                    >
                      {preset.label}
                    </span>
                    {isSelected && (
                      <span
                        className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest"
                        style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-snug truncate" style={{ color: 'var(--text-placeholder)' }}>{preset.preview}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-placeholder)' }}>
            {selectedPreset ? `Editing "${selectedPreset.label}" template` : "Custom message"}
          </p>
          <textarea
            className="w-full rounded-xl p-4 text-sm outline-none transition-all min-h-[110px] leading-relaxed resize-none"
            value={dmContent}
            onChange={(e) => setDmContent(e.target.value)}
            placeholder="Write your greeting message here..."
            style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-placeholder)' }}>This message is shown with a confirmation button below it.</p>
        </div>

        {/* Confirmation button label */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Confirmation Button Text</label>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="e.g. Yes, Send it, I want it"
            className="w-full rounded-xl h-11 px-4 text-sm outline-none transition-all"
            style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <p className="text-[11px]" style={{ color: 'var(--text-placeholder)' }}>The user taps this button to confirm interest and receive the content.</p>
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

      {/* ── Step 2: Content Delivery ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black"
            style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}
          >2</span>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Delivery Message</label>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-placeholder)' }}>Sent after the user confirms (and follows, if required). Include your link here.</p>
          </div>
        </div>

        <div>
          <textarea
            className="w-full rounded-xl p-4 text-sm outline-none transition-all min-h-[90px] leading-relaxed resize-none"
            value={deliveryMessage}
            onChange={(e) => setDeliveryMessage(e.target.value)}
            placeholder="e.g. Thank you for your support! 🙌🙏&#10;&#10;Here you go. Click the button below to get your content :)"
            style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Link */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>
            Link URL <span className="font-medium normal-case tracking-normal" style={{ color: 'var(--text-placeholder)' }}>(optional)</span>
          </label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://yourlink.com"
            className="w-full rounded-xl h-11 px-4 text-sm outline-none transition-all font-medium"
            style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--primary)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--input-border)';
              e.currentTarget.style.boxShadow = 'none';
              if (e.target.value) setLinkUrl(normalizeUrl(e.target.value));
            }}
          />
          {linkUrl && linkUrl.startsWith('https://') && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--success)' }}>✓ Valid URL</p>
          )}
          {linkUrl && !linkUrl.startsWith('https://') && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--warning)' }}>URL will be auto-corrected to https://</p>
          )}
          {linkUrl && (
            <a href={normalizeUrl(linkUrl)} target="_blank" rel="noopener noreferrer"
              className="text-[11px] mt-0.5 inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--primary)' }}>
              Preview: {normalizeUrl(linkUrl)} ↗
            </a>
          )}
        </div>

        {/* Delivery button label */}
        {linkUrl && (
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-placeholder)' }}>Link Button Label</label>
            <input
              type="text"
              value={deliveryButtonText}
              onChange={(e) => setDeliveryButtonText(e.target.value)}
              placeholder="e.g. Goto NVIDIA, Get Access, View Content"
              className="w-full rounded-xl h-11 px-4 text-sm outline-none transition-all"
              style={{ backgroundColor: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
