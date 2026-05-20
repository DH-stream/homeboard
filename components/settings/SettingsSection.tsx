"use client";

import { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description: string;
  eyebrow?: string;
  status?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function SettingsSection({ title, description, eyebrow, status, defaultOpen = false, children }: SettingsSectionProps) {
  return (
    <details className="group rounded-[2rem] border border-stone-200/80 bg-white/95 shadow-[0_10px_26px_rgba(36,28,21,0.07)]" open={defaultOpen ? true : undefined}>
      <summary className="list-none cursor-pointer px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{eyebrow ?? title}</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-stone-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-stone-700">{description}</p>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {status ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{status}</p> : null}
            <span className="text-stone-500 transition-transform duration-150 ease-[var(--ease-out)] group-open:rotate-180" aria-hidden="true">⌄</span>
          </div>
        </div>
      </summary>
      <div className="border-t border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-4 md:grid-cols-2">{children}</div>
      </div>
    </details>
  );
}
