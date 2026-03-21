import { cn } from "@/lib/utils";

export const Toggle = ({ on, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "w-10 h-[22px] rounded-full relative cursor-pointer transition-colors flex-shrink-0"
    )}
    style={{ backgroundColor: on ? 'var(--success)' : 'var(--text-placeholder)' }}
  >
    <div className={cn(
      "absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all",
      on ? "left-[21px]" : "left-[3px]"
    )} />
  </div>
);
