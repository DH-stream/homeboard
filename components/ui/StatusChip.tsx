import type { ReactNode } from "react";

type StatusChipTone = "amber" | "emerald" | "rose" | "stone" | "dark";

const toneClasses: Record<StatusChipTone, string> = {
  amber: "bg-amber-100 text-amber-800 ring-amber-200/70",
  emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200/70",
  rose: "bg-rose-100 text-rose-800 ring-rose-200/70",
  stone: "bg-stone-100 text-stone-700 ring-stone-200/70",
  dark: "bg-stone-950 text-white ring-white/10",
};

export function StatusChip({ children, tone = "stone" }: { children: ReactNode; tone?: StatusChipTone }) {
  return <span className={`status-chip ring-1 ${toneClasses[tone]}`}>{children}</span>;
}
