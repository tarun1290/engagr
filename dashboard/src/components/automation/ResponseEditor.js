import { Info, Plus } from "lucide-react";
import { Toggle } from "./UIHelpers";

export default function ResponseEditor({ 
  dmContent, setDmContent, 
  buttonText, setButtonText,
  linkUrl, setLinkUrl 
}) {
  return (
    <div className="animate-in slide-in-from-top-6 duration-500 mt-16 pt-16 border-t border-slate-100">
      <h2 className="text-[17px] font-bold text-slate-900 mb-6">They will get</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-slate-700 font-medium">an opening DM</span>
            <Toggle on={true} onClick={() => {}} />
          </div>
          
          <div className="space-y-3">
            <textarea 
              className="w-full bg-white border border-blue-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all min-h-[120px] leading-relaxed resize-none"
              value={dmContent}
              onChange={(e) => setDmContent(e.target.value)}
            />
            
            <input 
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl h-11 px-4 text-sm focus:border-blue-400 outline-none"
              placeholder="Button label..."
            />
          </div>
        </div>

        <div className="pt-10 mt-10 border-t-2 border-dashed border-slate-100">
          <h2 className="text-[17px] font-bold text-slate-900 mb-6">And then, they will get</h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-slate-700 font-medium">a DM with a link</span>
                <Toggle on={true} onClick={() => {}} />
              </div>
              
              <div className="space-y-3">
                <input 
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none font-medium text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
