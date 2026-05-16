import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p> : null}
        <h2 className="text-2xl font-black tracking-tight text-stone-950 md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
