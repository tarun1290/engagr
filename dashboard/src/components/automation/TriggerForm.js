import { cn } from "@/lib/utils";
import { Toggle } from "./UIHelpers";

const RadioOption = ({ selected, onClick, label, pro }) => (
  <div 
    onClick={onClick} 
    className="flex items-center gap-3 mb-4 cursor-pointer group select-none"
  >
    <div className={cn(
      "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all",
      selected ? "border-blue-500 bg-blue-500" : "border-slate-300 group-hover:border-slate-400"
    )}>
      {selected && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
    </div>
    <span className="text-[14px] text-slate-700 font-medium">{label}</span>
    {pro && (
      <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ml-1">
        PRO
      </span>
    )}
  </div>
);

export default function TriggerForm({ 
  postTrigger, setPostTrigger, 
  commentTrigger, setCommentTrigger,
  selectedPost, setSelectedPost,
  keywords, setKeywords,
  replyToggle, setReplyToggle,
  replyMessages, setReplyMessages,
  media = []
}) {
  return (
    <div className="animate-in slide-in-from-left-4 duration-300">
      <h2 className="text-[17px] font-bold text-slate-900 mb-6 font-primary">When someone comments on</h2>
      
      <div className="space-y-1 mb-8">
        <RadioOption 
          selected={postTrigger === "specific"} 
          onClick={() => setPostTrigger("specific")} 
          label="a specific post or reel" 
        />

        {postTrigger === "specific" && (
          <div className="ml-8 mb-6">
            <div className="flex gap-2 flex-wrap mb-3">
              {media.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPost(p.id)} 
                  className={cn(
                    "w-[70px] h-[70px] rounded-xl overflow-hidden cursor-pointer transition-all border-[2.5px] bg-slate-100",
                    selectedPost === p.id ? "border-blue-500 shadow-lg shadow-blue-100 scale-105" : "border-transparent opacity-80"
                  )}
                >
                  <img 
                    src={p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url} 
                    alt="IG Post" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {media.length === 0 && <p className="text-xs text-slate-400 italic">No recent posts found.</p>}
            </div>
          </div>
        )}

        <RadioOption selected={postTrigger === "any"} onClick={() => setPostTrigger("any")} label="any post or reel" pro />
      </div>

      <div className="h-px bg-slate-100 w-full my-8" />

      <h2 className="text-[17px] font-bold text-slate-900 mb-6">And this comment has</h2>
      
      <div className="space-y-1 mb-8">
        <RadioOption 
          selected={commentTrigger === "specific"} 
          onClick={() => setCommentTrigger("specific")} 
          label="a specific word or words" 
        />

        {commentTrigger === "specific" && (
          <div className="ml-8 mb-6 space-y-3">
            <input 
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter a word or multiple (separated by commas)"
              className="w-full bg-white border border-slate-200 rounded-xl h-11 px-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Common:</span>
              {["Price", "Link", "Shop"].map(word => (
                <button 
                  key={word}
                  onClick={() => setKeywords(prev => prev ? `${prev}, ${word}` : word)}
                  className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        <RadioOption selected={commentTrigger === "any"} onClick={() => setCommentTrigger("any")} label="any word" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[13px] text-slate-700">
          <span>Automatically reply to their comment</span>
          <Toggle on={replyToggle} onClick={() => setReplyToggle(!replyToggle)} />
        </div>

        {replyToggle && (
          <div className="space-y-2">
            {replyMessages.map((text, i) => (
              <input 
                key={i}
                type="text"
                value={text}
                onChange={(e) => {
                  const newMessages = [...replyMessages];
                  newMessages[i] = e.target.value;
                  setReplyMessages(newMessages);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl h-10 px-4 text-sm focus:border-blue-400 outline-none"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
