export default function ResponseEditor({
  dmContent, setDmContent,
  buttonText, setButtonText,
  linkUrl, setLinkUrl
}) {
  return (
    <div className="space-y-8">

      {/* DM message */}
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Opening DM</label>
          <p className="text-[12px] text-slate-400 mt-0.5">Sent privately when someone triggers the automation.</p>
        </div>
        <textarea
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[110px] leading-relaxed resize-none"
          value={dmContent}
          onChange={(e) => setDmContent(e.target.value)}
          placeholder="Write your auto-DM message here..."
        />
      </div>

      {/* Link (optional) */}
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Link <span className="text-slate-300 font-medium normal-case tracking-normal">(optional)</span></label>
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
