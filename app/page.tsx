"use client";

import { useEffect, useRef, useState } from "react";
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
  wall: "setup-option-card--wall",
  mobile: "setup-option-card--mobile",
  admin: "setup-option-card--admin",
};

function getDeviceModeCopy(mode: DeviceMode, t: ReturnType<typeof useLanguage>["t"]) {
  if (mode === "wall") return { title: t("deviceModeWall"), description: t("deviceModeWallDescription") };
  if (mode === "admin") return { title: t("deviceModeAdmin"), description: t("deviceModeAdminDescription") };
  return { title: t("deviceModeMobile"), description: t("deviceModeMobileDescription") };
}

function Cloud({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 420 160" fill="none" aria-hidden="true">
      <path
        d="M107 121C74.4 121 48 98.4 48 70.6C48 44.1 72.2 22.5 102.8 20.3C118.3 7.6 140.5 0 164.8 0C198.2 0 226.9 14.5 239.5 35.2C248.7 32 258.9 30.2 269.6 30.2C304.6 30.2 333.7 49.2 340 74.2C359.5 78.6 374 92.6 374 109.2C374 129 353.4 145 328 145H107V121Z"
        fill="white"
        fillOpacity="0.94"
      />
      <path
        d="M112 129C80.5 129 55 107.4 55 80.9C55 55.9 78.4 35.5 108.1 33.4C123.1 21.7 144.5 14.7 167.8 14.7C199.9 14.7 227.6 28.2 239.8 47.7C248.7 44.7 258.5 43 268.8 43C302.5 43 330.6 61 336.6 84.7C355.4 88.9 369.4 102.2 369.4 118C369.4 136.8 349.5 152 325 152H112V129Z"
        fill="#D97706"
        fillOpacity="0.08"
      />
    </svg>
  );
}

function SetupSky() {
  return (
    <div className="setup-sky" aria-hidden="true">
      <div className="setup-sun" />
      <div className="setup-cloud-track setup-cloud-track-far">
        <Cloud className="setup-cloud setup-cloud-small" />
        <Cloud className="setup-cloud setup-cloud-small setup-cloud-copy" />
      </div>
      <div className="setup-cloud-track setup-cloud-track-mid">
        <Cloud className="setup-cloud setup-cloud-medium" />
        <Cloud className="setup-cloud setup-cloud-medium setup-cloud-copy" />
      </div>
      <div className="setup-cloud-track setup-cloud-track-near">
        <Cloud className="setup-cloud setup-cloud-large" />
        <Cloud className="setup-cloud setup-cloud-large setup-cloud-copy" />
      </div>
      <div className="setup-sky-accent setup-sky-star">✦</div>
      <div className="setup-sky-accent setup-sky-check">✓</div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isCheckingStartView, setIsCheckingStartView] = useState(true);
  const [selectedStartView, setSelectedStartView] = useState<DeviceStartView | null>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startView = readDeviceStartView();

    if (startView) {
      router.replace(startView.route);
      return;
    }

    setIsCheckingStartView(false);
  }, [router]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
    };
  }, []);

  const chooseStartView = (startView: DeviceStartView) => {
    if (selectedStartView) return;

    saveDeviceStartView(startView);
    setSelectedStartView(startView);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    navigationTimeoutRef.current = setTimeout(() => {
      router.push(startView.route);
    }, prefersReducedMotion ? 180 : 1250);
  };

  if (isCheckingStartView) {
    return <main className="min-h-screen" aria-hidden="true" />;
  }

  return (
    <main className={`setup-stage ${selectedStartView ? "setup-stage--leaving" : ""} relative isolate min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-10`}>
      <SetupSky />

      <section className="setup-hero relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center py-8 sm:min-h-[calc(100vh-5rem)]">
        <div className="surface-card setup-hero-card relative overflow-hidden rounded-[2.5rem] px-5 py-7 backdrop-blur-xl sm:rounded-[3.5rem] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="setup-card-shine" aria-hidden="true" />
          <div className="setup-card-wake" aria-hidden="true" />
          <div className="setup-hero-copy mx-auto max-w-3xl text-center">
            <div className="setup-spark mx-auto flex size-16 items-center justify-center rounded-[1.4rem] bg-white/86 text-4xl shadow-[0_18px_45px_rgba(120,72,22,0.16)] ring-1 ring-white/80 sm:size-20 sm:rounded-[1.8rem] sm:text-5xl">
              ✨
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.32em] text-amber-700">HomeBoard</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] text-stone-950 sm:text-6xl lg:text-7xl">{t("deviceStartViewSetupTitle")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-8 text-stone-600 sm:text-xl">{t("deviceStartViewSetupCopy")}</p>
          </div>

          <div className="setup-options mt-8 grid gap-4 lg:mt-10 lg:grid-cols-3">
            {DEVICE_START_VIEW_OPTIONS.map((option, index) => {
              const copy = getDeviceModeCopy(option.mode, t);
              const isSelected = selectedStartView?.mode === option.mode;
              const isSoftened = selectedStartView !== null && !isSelected;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`setup-option-card setup-stagger-${index + 1} ${optionAccents[option.mode]} ${isSelected ? "setup-option-card--selected" : ""} ${isSoftened ? "setup-option-card--softened" : ""} pressable hover-lift group flex min-h-52 flex-col rounded-[2.25rem] p-5 text-left shadow-[0_18px_55px_rgba(84,59,34,0.10)] ring-1 ring-white/80 sm:min-h-56 sm:p-6`}
                  aria-disabled={selectedStartView !== null}
                  key={option.mode}
                  onClick={() => chooseStartView(option)}
                  type="button"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="setup-option-icon flex size-16 items-center justify-center rounded-[1.6rem] bg-white/86 text-4xl shadow-sm ring-1 ring-black/5 sm:size-20 sm:text-5xl">
                      {optionIcons[option.mode]}
                    </span>
                    <span className="setup-option-check mt-1 flex size-9 items-center justify-center rounded-full bg-white/78 text-lg font-black text-amber-700 opacity-80 shadow-sm ring-1 ring-black/5 transition-transform duration-150 ease-[var(--ease-out)] group-active:scale-95">
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
          <div className="setup-confirmation" aria-live="polite">
            {selectedStartView ? <p>{selectedStartView.mode === "wall" ? t("deviceStartViewWallConfirmation") : t("deviceStartViewConfirmation")}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
