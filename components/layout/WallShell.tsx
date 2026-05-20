"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { shouldShowDebugNavigation } from "@/lib/devicePreferences";
import { useLanguage } from "@/lib/i18n";
import { saveLastStableRoute } from "@/lib/navigation/lastStableRoute";

export function WallShell({ children, revealActive = false }: { children: ReactNode; revealActive?: boolean }) {
  const { t } = useLanguage();
  const showDebugNavigation = shouldShowDebugNavigation();

  useEffect(() => {
    if (typeof window !== "undefined") saveLastStableRoute("/wall");
  }, []);

  return (
    <main className={`min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,0.25),transparent_30rem),linear-gradient(135deg,#fff8ed,#eefdf8_55%,#f7f2ff)] p-5 text-stone-950 lg:p-8 ${revealActive ? "first-run-reveal first-run-reveal--active wall-first-run-reveal" : ""}`}>
      <div className={`mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1500px] flex-col rounded-[2.5rem] border border-white/70 bg-white/55 p-5 shadow-[var(--surface-shadow-strong)] backdrop-blur-md lg:min-h-[calc(100vh-4rem)] lg:p-8 ${revealActive ? "reveal-item reveal-item--surface reveal-stagger-1" : ""}`}>
        <div className={`mb-5 flex items-center justify-between text-sm font-semibold text-stone-500 ${revealActive ? "reveal-item reveal-item--header reveal-stagger-2" : ""}`}>
          <Link className="pressable min-h-11 rounded-full bg-white/70 px-4 py-2 text-stone-700 shadow-sm" href="/">
            HomeBoard
          </Link>
          {showDebugNavigation ? (
            <Link className="pressable min-h-11 rounded-full bg-stone-950 px-4 py-2 text-white shadow-sm" href="/app">
              {t("manageTasks")}
            </Link>
          ) : (
            <Link className="pressable min-h-11 rounded-full bg-stone-950 px-4 py-2 text-white shadow-sm" href="/settings?returnTo=%2Fwall">
              {t("settings")}
            </Link>
          )}
        </div>
        {children}
      </div>
    </main>
  );
}
