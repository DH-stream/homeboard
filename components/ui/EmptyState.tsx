import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-stone-300/80 bg-white/65 p-8 text-center shadow-inner shadow-white/50">
      <p className="text-lg font-black text-stone-800">{title}</p>
      <div className="mt-2 text-sm font-medium leading-6 text-stone-500">{children}</div>
    </div>
  );
}
