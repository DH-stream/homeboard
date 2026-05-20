"use client";

import { ReactNode, useEffect, useState } from "react";

type SettingsSectionProps = {
  title: string;
  description: string;
  status: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function SettingsSection({ title, description, status, defaultOpen = false, children }: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <details className="group rounded-[1.9rem] border border-stone-200/80 bg-white/95 shadow-[0_12px_30px_rgba(36,28,21,0.08)]" onToggle={(event) => setIsOpen(event.currentTarget.open)} open={isOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[1.9rem] px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{title}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-stone-700">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-black text-stone-700">{status}</span>
          <span className="text-stone-500 transition-transform duration-150 ease-[var(--ease-out)] group-open:rotate-180" aria-hidden="true">⌄</span>
        </div>
      </summary>
      <div className="grid gap-4 border-t border-stone-100 p-4 sm:p-5 md:grid-cols-2">{children}</div>
    </details>
  );
}
