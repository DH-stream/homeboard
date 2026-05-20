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
    <details className="group overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white/95 shadow-[0_10px_26px_rgba(36,28,21,0.07)] sm:rounded-[2rem]" open={defaultOpen ? true : undefined}>
      <summary className="list-none cursor-pointer px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{eyebrow ?? title}</p>
            <h2 className="mt-1 text-base font-black tracking-tight text-stone-950 sm:text-lg">{title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-stone-700">{description}</p>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {status ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{status}</p> : null}
            <span className="text-stone-500 transition-transform duration-150 ease-[var(--ease-out)] group-open:rotate-180" aria-hidden="true">⌄</span>
          </div>
        </div>
      </summary>
      <div className="section-reveal border-t border-stone-100 px-3 py-3 sm:px-6 sm:py-5">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">{children}</div>
      </div>
    </details>
  );
}
