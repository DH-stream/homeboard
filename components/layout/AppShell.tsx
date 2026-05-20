"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import { shouldShowDebugNavigation } from "@/lib/devicePreferences";
import { useLanguage } from "@/lib/i18n";
import { getRememberedStableRoute, getStableSettingsBackTarget, isStableAppRoute, rememberStableRoute } from "@/lib/navigation/stableRoutes";

function AppShellInner({ children, title, eyebrow, revealActive = false }: { children: ReactNode; title: string; eyebrow?: string; revealActive?: boolean }) {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDebugNavigation = shouldShowDebugNavigation();
  const isSettingsPage = pathname === "/settings";
  const returnTo = isSettingsPage ? searchParams.get("returnTo") : null;
  const lastStableRoute = typeof window !== "undefined" ? getRememberedStableRoute() : null;
  const settingsBackHref = isSettingsPage ? getStableSettingsBackTarget({ returnTo, rememberedRoute: lastStableRoute }) : "/settings";
  const settingsHref = isStableAppRoute(pathname, searchParams) ? `/settings?returnTo=${encodeURIComponent(pathname)}` : "/settings";
  const backLabel = language === "sv" ? "Tillbaka" : "Back";

  useEffect(() => {
    if (typeof window !== "undefined") rememberStableRoute(pathname, searchParams);
  }, [pathname, searchParams]);


  return (
    <main className={`mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 safe-top safe-bottom sm:px-6 ${revealActive ? "first-run-reveal first-run-reveal--active app-first-run-reveal" : ""}`}>
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
          <button className="pressable min-h-11 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-950" onClick={() => router.replace(settingsBackHref)} type="button">
            ← {backLabel}
          </button>
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

export function AppShell(props: { children: ReactNode; title: string; eyebrow?: string; revealActive?: boolean }) {
  return (
    <Suspense fallback={null}>
      <AppShellInner {...props} />
    </Suspense>
  );
}
