"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getDefaultRouteForMode, getDeviceProfile, readDeviceStartView, shouldShowDebugNavigation } from "@/lib/devicePreferences";
import { useLanguage } from "@/lib/i18n";

const SAFE_SETTINGS_RETURN_ROUTES = new Set(["/app", "/wall"]);

function getSettingsBackHref(returnTo: string | null) {
  if (returnTo && SAFE_SETTINGS_RETURN_ROUTES.has(returnTo)) return returnTo;

  const startView = readDeviceStartView();
  const profile = startView?.mode ?? getDeviceProfile();
  if (profile === "wall") return "/wall";
  if (profile === "mobile") return "/app";
  if (profile === "admin") return "/app";
  const fallback = getDefaultRouteForMode("mobile");
  return SAFE_SETTINGS_RETURN_ROUTES.has(fallback) ? fallback : "/app";
}

export function AppShell({ children, title, eyebrow, revealActive = false }: { children: ReactNode; title: string; eyebrow?: string; revealActive?: boolean }) {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const showDebugNavigation = shouldShowDebugNavigation();
  const isSettingsPage = pathname === "/settings";
  const returnTo = isSettingsPage && typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("returnTo") : null;
  const settingsBackHref = isSettingsPage ? getSettingsBackHref(returnTo) : "/settings";
  const settingsHref = SAFE_SETTINGS_RETURN_ROUTES.has(pathname) ? `/settings?returnTo=${encodeURIComponent(pathname)}` : "/settings";
  const backLabel = language === "sv" ? "Tillbaka" : "Back";

  return (
    <main className={`mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 safe-bottom sm:px-6 ${revealActive ? "first-run-reveal first-run-reveal--active app-first-run-reveal" : ""}`}>
      <header className={`mb-5 flex items-center justify-between gap-4 surface-card rounded-[2rem] p-4 backdrop-blur ${revealActive ? "reveal-item reveal-item--header reveal-stagger-1" : ""}`}>
        <div>
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">{eyebrow}</p> : null}
          <h1 className="text-2xl font-black tracking-tight text-stone-950">{title}</h1>
        </div>
        {showDebugNavigation ? (
          <nav className="flex rounded-full bg-stone-100 p-1 text-sm font-semibold text-stone-600">
            <Link className="pressable min-h-11 rounded-full px-3 py-2 hover:bg-white hover:text-stone-950" href="/app">
              {t("app")}
            </Link>
            <Link className="pressable min-h-11 rounded-full px-3 py-2 hover:bg-white hover:text-stone-950" href={settingsHref}>
              {t("settings")}
            </Link>
          </nav>
        ) : isSettingsPage ? (
          <Link className="pressable min-h-11 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-950" href={settingsBackHref}>
            ← {backLabel}
          </Link>
        ) : (
          <Link className="pressable min-h-11 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-950" href={settingsHref}>
            {t("settings")}
          </Link>
        )}
      </header>
      {children}
    </main>
  );
}