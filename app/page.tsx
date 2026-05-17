"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEVICE_START_VIEW_OPTIONS,
  readDeviceStartView,
  saveDeviceStartView,
  type DeviceMode,
  type DeviceStartView,
} from "@/lib/devicePreferences";
import { useLanguage } from "@/lib/i18n";

const optionIcons: Record<DeviceMode, string> = {
  wall: "🏠",
  mobile: "📱",
  admin: "⚙️",
};

const optionAccents: Record<DeviceMode, string> = {
  wall: "from-amber-100 via-orange-50 to-white",
  mobile: "from-emerald-100 via-teal-50 to-white",
  admin: "from-stone-100 via-amber-50 to-white",
};

function getDeviceModeCopy(mode: DeviceMode, t: ReturnType<typeof useLanguage>["t"]) {
  if (mode === "wall") return { title: t("deviceModeWall"), description: t("deviceModeWallDescription") };
  if (mode === "admin") return { title: t("deviceModeAdmin"), description: t("deviceModeAdminDescription") };
  return { title: t("deviceModeMobile"), description: t("deviceModeMobileDescription") };
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isCheckingStartView, setIsCheckingStartView] = useState(true);

  useEffect(() => {
    const startView = readDeviceStartView();

    if (startView) {
      router.replace(startView.route);
      return;
    }

    setIsCheckingStartView(false);
  }, [router]);

  const chooseStartView = (startView: DeviceStartView) => {
    saveDeviceStartView(startView);
    router.push(startView.route);
  };

  if (isCheckingStartView) {
    return <main className="min-h-screen" aria-hidden="true" />;
  }

  return (
    <main className="setup-stage relative isolate min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-10">
      <div className="setup-glow setup-glow-amber" aria-hidden="true" />
      <div className="setup-glow setup-glow-emerald" aria-hidden="true" />
      <div className="setup-orb setup-orb-home" aria-hidden="true">🏡</div>
      <div className="setup-orb setup-orb-star" aria-hidden="true">✦</div>
      <div className="setup-orb setup-orb-check" aria-hidden="true">✓</div>
      <div className="setup-orb setup-orb-dot" aria-hidden="true" />

      <section className="setup-hero relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center py-8 sm:min-h-[calc(100vh-5rem)]">
        <div className="surface-card setup-hero-card relative overflow-hidden rounded-[2.5rem] px-5 py-7 backdrop-blur-xl sm:rounded-[3.5rem] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="setup-card-shine" aria-hidden="true" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-[1.4rem] bg-white/80 text-4xl shadow-[0_18px_45px_rgba(120,72,22,0.16)] ring-1 ring-white/80 sm:size-20 sm:rounded-[1.8rem] sm:text-5xl">
              ✨
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.32em] text-amber-700">HomeBoard</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] text-stone-950 sm:text-6xl lg:text-7xl">{t("deviceStartViewSetupTitle")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-8 text-stone-600 sm:text-xl">{t("deviceStartViewSetupCopy")}</p>
          </div>

          <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-3">
            {DEVICE_START_VIEW_OPTIONS.map((option, index) => {
              const copy = getDeviceModeCopy(option.mode, t);

              return (
                <button
                  className={`setup-option-card setup-stagger-${index + 1} pressable hover-lift group flex min-h-52 flex-col rounded-[2.25rem] bg-gradient-to-br ${optionAccents[option.mode]} p-5 text-left shadow-[0_18px_55px_rgba(84,59,34,0.10)] ring-1 ring-white/80 sm:min-h-56 sm:p-6`}
                  key={option.mode}
                  onClick={() => chooseStartView(option)}
                  type="button"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="flex size-16 items-center justify-center rounded-[1.6rem] bg-white/82 text-4xl shadow-sm ring-1 ring-black/5 sm:size-20 sm:text-5xl">
                      {optionIcons[option.mode]}
                    </span>
                    <span className="mt-1 flex size-9 items-center justify-center rounded-full bg-white/72 text-lg font-black text-amber-700 opacity-80 shadow-sm ring-1 ring-black/5 transition-transform duration-150 ease-[var(--ease-out)] group-active:scale-95">
                      ✓
                    </span>
                  </span>
                  <span className="mt-6 text-3xl font-black tracking-[-0.035em] text-stone-950 sm:text-4xl">{copy.title}</span>
                  <span className="mt-3 max-w-sm text-lg font-semibold leading-8 text-stone-600">{copy.description}</span>
                </button>
              );
            })}
          </div>

          <p className="setup-footer-note mx-auto mt-7 max-w-xl text-center text-sm font-bold leading-6 text-stone-500 sm:text-base">{t("deviceStartViewFooter")}</p>
        </div>
      </section>
    </main>
  );
}
