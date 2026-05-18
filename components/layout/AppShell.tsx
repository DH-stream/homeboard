"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "@/lib/i18n";

export function AppShell({ children, title, eyebrow, revealActive = false }: { children: ReactNode; title: string; eyebrow?: string; revealActive?: boolean }) {
  const { t } = useLanguage();

  return (
    <main className={`mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 safe-bottom sm:px-6 ${revealActive ? "first-run-reveal first-run-reveal--active app-first-run-reveal" : ""}`}>
      <header className={`mb-5 flex items-center justify-between gap-4 surface-card rounded-[2rem] p-4 backdrop-blur ${revealActive ? "reveal-item reveal-item--header reveal-stagger-1" : ""}`}>
        <div>
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">{eyebrow}</p> : null}
          <h1 className="text-2xl font-black tracking-tight text-stone-950">{title}</h1>
        </div>
        <nav className="flex rounded-full bg-stone-100 p-1 text-sm font-semibold text-stone-600">
          <Link className="pressable min-h-11 rounded-full px-3 py-2 hover:bg-white hover:text-stone-950" href="/app">
            {t("app")}
          </Link>
          <Link className="pressable min-h-11 rounded-full px-3 py-2 hover:bg-white hover:text-stone-950" href="/settings">
            {t("settings")}
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
