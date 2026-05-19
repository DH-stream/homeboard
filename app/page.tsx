"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  canSelectAdultProfile,
  getOrCreateDeviceId,
  DEVICE_START_VIEW_OPTIONS,
  readDeviceStartView,
  saveDeviceStartView,
  setDeviceProfile,
  type DeviceMode,
  type DeviceStartView,
} from "@/lib/devicePreferences";
import { setPendingFirstRunReveal, type FirstRunRevealRoute } from "@/lib/firstRunReveal";
import { useAdultAccess } from "@/lib/hooks/useAdultAccess";
import { useLanguage, type Language } from "@/lib/i18n";

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

const revealRouteByMode: Record<DeviceMode, FirstRunRevealRoute> = {
  wall: "wall",
  mobile: "app",
  admin: "settings",
};

const SETUP_TASK_HINT_SLOTS = [
  { id: "a", style: { top: "14%", left: "7%" } },
  { id: "b", style: { top: "20%", right: "8%" } },
  { id: "c", style: { top: "38%", left: "13%" } },
  { id: "d", style: { top: "42%", right: "13%" } },
  { id: "e", style: { bottom: "26%", left: "18%" } },
  { id: "f", style: { bottom: "18%", right: "10%" } },
  { id: "g", style: { top: "31%", left: "33%" } },
  { id: "h", style: { bottom: "34%", right: "29%" } },
  { id: "i", style: { top: "58%", right: "18%" } },
  { id: "j", style: { bottom: "15%", left: "36%" } },
] satisfies Array<{ id: string; style: CSSProperties }>;
const SETUP_TASK_HINT_TONES = ["amber", "emerald", "sky", "rose", "stone"] as const;

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
    <div className="setup-sky z-0" aria-hidden="true">
      <Cloud className="setup-cloud setup-cloud-anchor setup-cloud-anchor-left" />
      <Cloud className="setup-cloud setup-cloud-anchor setup-cloud-anchor-right" />
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
    </div>
  );
}

type HintSlot = typeof SETUP_TASK_HINT_SLOTS[number];
type HintTone = typeof SETUP_TASK_HINT_TONES[number];
type VisibleHint = { id: string; text: string; slot: HintSlot; tone: HintTone; phase: "enter" | "visible" | "exit" };

function pickNextSlot(usedSlots: Set<string>, tick: number, replaceIndex: number, previousSlotId?: string) {
  const availableSlots = SETUP_TASK_HINT_SLOTS.filter((slot) => !usedSlots.has(slot.id) && slot.id !== previousSlotId);
  const pool = availableSlots.length ? availableSlots : SETUP_TASK_HINT_SLOTS.filter((slot) => !usedSlots.has(slot.id));
  if (!pool.length) return SETUP_TASK_HINT_SLOTS[(tick * 7 + replaceIndex * 3 + 2) % SETUP_TASK_HINT_SLOTS.length];
  return pool[(tick * 7 + replaceIndex * 5 + 3) % pool.length];
}

function SetupTaskHints({ language }: { language: "en" | "sv" }) {
  const hints = useMemo(() => language === "sv"
    ? ["Packa förskoleväskan", "Ta ut soporna", "Gympapåse på torsdag", "Kolla kalendern", "Hämta paket", "Vattna växterna", "Lägg fram regnkläder", "Kom ihåg BVC", "Handla mjölk", "Ladda surfplattan", "Mormor kommer 15:00", "Glöm inte regnjackan", "Fredagsmys", "Byt lakan", "Ställ ut återvinningen"]
    : ["Pack daycare bag", "Take out trash", "Gym bag on Thursday", "Check calendar", "Pick up package", "Water the plants", "Put out rain clothes", "Remember appointment", "Buy milk", "Charge tablet", "Grandma visits at 3", "Don't forget rain jacket", "Friday cozy time", "Change sheets", "Take out recycling"], [language]);
  const [visibleHints, setVisibleHints] = useState<VisibleHint[]>(() => hints.slice(0, 3).map((text, index) => ({ id: `hint-${index}`, text, slot: SETUP_TASK_HINT_SLOTS[index * 3], tone: SETUP_TASK_HINT_TONES[index % SETUP_TASK_HINT_TONES.length], phase: "enter" })));

  useEffect(() => {
    const timerIds: number[] = [];

    const trackTimer = (id: number) => {
      timerIds.push(id);
      return id;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleHints(hints.slice(0, 2).map((text, index) => ({ id: `hint-reduced-${index}`, text, slot: SETUP_TASK_HINT_SLOTS[index * 4], tone: SETUP_TASK_HINT_TONES[index % SETUP_TASK_HINT_TONES.length], phase: "visible" })));
      return () => {
        timerIds.forEach((id) => window.clearTimeout(id));
      };
    }

    let tick = 0;
    let idCounter = 100;

    const cycle = () => {
      let exitingHint: VisibleHint | undefined;
      setVisibleHints((current) => {
        if (!current.length) return current;
        const replaceIndex = tick % current.length;
        exitingHint = current[replaceIndex];
        return current.map((hint, index) => (index === replaceIndex ? { ...hint, phase: "exit" } : hint));
      });

      trackTimer(window.setTimeout(() => {
      tick += 1;
      setVisibleHints((current) => {
        const visibleCount = window.matchMedia("(max-width: 640px)").matches ? 2 : 3;
        const base = current.slice(0, visibleCount);
        const replaceIndex = (tick - 1) % Math.max(1, base.length);
        const usedTexts = new Set(base.map((hint, index) => (index === replaceIndex ? null : hint.text)).filter(Boolean) as string[]);
        const usedSlots = new Set(base.map((hint, index) => (index === replaceIndex ? null : hint.slot.id)).filter(Boolean) as string[]);

        const hintIndex = (tick * 5 + replaceIndex * 7) % hints.length;
        const nextText = hints.find((text, idx) => idx >= hintIndex && !usedTexts.has(text)) ?? hints.find((text) => !usedTexts.has(text)) ?? hints[hintIndex];
        const nextSlot = pickNextSlot(usedSlots, tick, replaceIndex, exitingHint?.slot.id);
        const nextTone = SETUP_TASK_HINT_TONES[(tick * 2 + replaceIndex) % SETUP_TASK_HINT_TONES.length];
        const replacement: VisibleHint = { id: `hint-${idCounter++}`, text: nextText, slot: nextSlot, tone: nextTone, phase: "enter" };

        const next = [...base];
        next[replaceIndex] = replacement;
        return next;
      });

      trackTimer(window.setTimeout(() => {
        setVisibleHints((current) => current.map((hint) => (hint.phase === "enter" ? { ...hint, phase: "visible" } : hint)));
      }, 700));

      trackTimer(window.setTimeout(cycle, 2250));
      }, 750));
    };

    trackTimer(window.setTimeout(() => {
      setVisibleHints((current) => current.map((hint) => ({ ...hint, phase: "visible" })));
    }, 700));
    trackTimer(window.setTimeout(cycle, 2250));
    return () => {
      timerIds.forEach((id) => window.clearTimeout(id));
    };
  }, [hints]);

  return (
    <div aria-hidden="true" className="setup-task-hints">
      {visibleHints.map((hint) => (
        <span className={`setup-task-hint setup-task-hint--${hint.phase} setup-task-hint--tone-${hint.tone}`} key={hint.id} style={hint.slot.style}>
          {hint.text}
        </span>
      ))}
    </div>
  );
}

function LanguageFlag({ language }: { language: Language }) {
  if (language === "sv") {
    return (
      <span className="relative block size-5 overflow-hidden rounded-full bg-[#006aa7] shadow-inner ring-1 ring-black/10" aria-hidden="true">
        <span className="absolute left-[34%] top-0 h-full w-[14%] bg-[#fecc00]" />
        <span className="absolute left-0 top-[43%] h-[14%] w-full bg-[#fecc00]" />
      </span>
    );
  }

  return (
    <span className="relative block size-5 overflow-hidden rounded-full bg-[#012169] shadow-inner ring-1 ring-black/10" aria-hidden="true">
      <span className="absolute left-1/2 top-1/2 h-[160%] w-[18%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
      <span className="absolute left-1/2 top-1/2 h-[160%] w-[18%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-white" />
      <span className="absolute left-1/2 top-1/2 h-[160%] w-[8%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#c8102e]" />
      <span className="absolute left-1/2 top-1/2 h-[160%] w-[8%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#c8102e]" />
      <span className="absolute left-0 top-[40%] h-[20%] w-full bg-white" />
      <span className="absolute left-[40%] top-0 h-full w-[20%] bg-white" />
      <span className="absolute left-0 top-[45%] h-[10%] w-full bg-[#c8102e]" />
      <span className="absolute left-[45%] top-0 h-full w-[10%] bg-[#c8102e]" />
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { hasAdultAccess } = useAdultAccess();
  const [isCheckingStartView, setIsCheckingStartView] = useState(true);
  const [selectedStartView, setSelectedStartView] = useState<DeviceStartView | null>(null);
  const [showAdultLockedMessage, setShowAdultLockedMessage] = useState(false);
  const [activeSetupState, setActiveSetupState] = useState<"chooser" | "adult_locked">("chooser");
  const [isSetupExiting, setIsSetupExiting] = useState(false);
  const [isAdultLockOpening, setIsAdultLockOpening] = useState(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adultLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextLanguage = language === "sv" ? "en" : "sv";
  const languageToggleLabel = language === "sv" ? "English" : "Svenska";
  const languageToggleAriaLabel = language === "sv" ? "Switch language to English" : "Byt språk till svenska";

  useEffect(() => {
    getOrCreateDeviceId();
    const startView = readDeviceStartView();

    if (startView) {
      router.replace(startView.route);
      return;
    }

    setIsCheckingStartView(false);
  }, [router]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
      if (adultLockTimeoutRef.current) clearTimeout(adultLockTimeoutRef.current);
    };
  }, []);

  const chooseStartView = (startView: DeviceStartView) => {
    if (selectedStartView || isAdultLockOpening) return;
    if (startView.mode === "admin" && !canSelectAdultProfile(hasAdultAccess)) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setShowAdultLockedMessage(false);
      setIsAdultLockOpening(true);
      adultLockTimeoutRef.current = setTimeout(() => {
        setActiveSetupState("adult_locked");
        setIsAdultLockOpening(false);
        setShowAdultLockedMessage(true);
        window.setTimeout(() => setShowAdultLockedMessage(false), 1800);
      }, prefersReducedMotion ? 80 : 520);
      return;
    }

    saveDeviceStartView(startView);
    setPendingFirstRunReveal(revealRouteByMode[startView.mode]);
    setSelectedStartView(startView);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    exitTimeoutRef.current = setTimeout(() => {
      setIsSetupExiting(true);
    }, prefersReducedMotion ? 60 : 520);

    navigationTimeoutRef.current = setTimeout(() => {
      router.push(startView.route);
    }, prefersReducedMotion ? 180 : 1450);
  };

  const continueWithProfile = (nextProfile: "mobile" | "wall") => {
    const next = setDeviceProfile(nextProfile);
    setPendingFirstRunReveal(revealRouteByMode[next.mode]);
    router.push(next.route);
  };

  if (isCheckingStartView) {
    return <main className="min-h-screen" aria-hidden="true" />;
  }

  return (
    <main className={`setup-stage ${selectedStartView ? "setup-stage--leaving" : ""} ${isSetupExiting ? "setup-stage--exiting" : ""} relative isolate min-h-screen overflow-hidden px-3 py-4 sm:px-6 sm:py-10`}>
      <SetupSky />
      <SetupTaskHints language={language} />
      <button
        aria-label={languageToggleAriaLabel}
        className="pressable hover-lift absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/76 py-1.5 pl-2 pr-3 text-xs font-black text-stone-700 shadow-[0_14px_40px_rgba(84,59,34,0.12)] ring-1 ring-black/5 backdrop-blur-xl transition-[transform,background,box-shadow] duration-200 ease-[var(--ease-out)] hover:bg-white/94 sm:right-6 sm:top-6 sm:py-2 sm:pl-2.5 sm:pr-4 sm:text-sm"
        onClick={() => setLanguage(nextLanguage)}
        type="button"
      >
        <span className="grid size-7 place-items-center rounded-full bg-white/88 shadow-sm ring-1 ring-black/5 sm:size-8" aria-hidden="true">
          <LanguageFlag language={nextLanguage} />
        </span>
        <span>{languageToggleLabel}</span>
      </button>

      <section className={`setup-hero relative z-10 mx-auto flex min-h-[calc(100svh-2rem)] max-w-5xl flex-col justify-center py-3 transition-[opacity,filter,transform] duration-500 ease-[var(--ease-out)] sm:min-h-[calc(100vh-5rem)] sm:max-w-6xl sm:py-8 ${isAdultLockOpening ? "scale-[0.998]" : ""}`}>
        <div className={`surface-card setup-hero-card relative mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] px-3 py-4 backdrop-blur-xl transition-[opacity,transform,filter] duration-500 ease-[var(--ease-out)] sm:rounded-[3.5rem] sm:px-8 sm:py-10 lg:px-12 lg:py-12 ${isAdultLockOpening ? "-translate-y-1 opacity-65 blur-[1px]" : ""}`}>
          <div className="setup-card-shine" aria-hidden="true" />
          <div className="setup-card-wake" aria-hidden="true" />
          <div className="setup-hero-copy mx-auto max-w-3xl text-center">
            <div className="setup-spark mx-auto flex size-11 items-center justify-center rounded-[1.1rem] bg-white/86 text-2xl shadow-[0_18px_45px_rgba(120,72,22,0.16)] ring-1 ring-white/80 sm:size-20 sm:rounded-[1.8rem] sm:text-5xl">
              ✨
            </div>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.32em] text-amber-700 sm:mt-5 sm:text-sm">HomeBoard</p>
            <h1 className="mt-2 text-[2.15rem] font-black leading-[0.96] tracking-[-0.055em] text-stone-950 sm:mt-3 sm:text-6xl lg:text-7xl">{t("deviceStartViewSetupTitle")}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-stone-600 sm:mt-4 sm:text-xl sm:leading-8">{t("deviceStartViewSetupCopy")}</p>
          </div>
        </div>

        {activeSetupState === "chooser" ? <div className="setup-options mt-4 grid gap-3 sm:mt-8 sm:gap-4 lg:mt-10 lg:grid-cols-3">
          {DEVICE_START_VIEW_OPTIONS.map((option, index) => {
            const copy = getDeviceModeCopy(option.mode, t);
            const isSelected = selectedStartView?.mode === option.mode;
            const isSoftened = selectedStartView !== null && !isSelected;
            const isLockedAdmin = option.mode === "admin" && !canSelectAdultProfile(hasAdultAccess);
            const isOpeningAdultLock = isAdultLockOpening && option.mode === "admin";
            const isDimmedForAdultLock = isAdultLockOpening && option.mode !== "admin";

            return (
              <button
                aria-pressed={isSelected || isOpeningAdultLock}
                className={`setup-option-card setup-stagger-${index + 1} ${optionAccents[option.mode]} ${isSelected ? "setup-option-card--selected" : ""} ${isSoftened ? "setup-option-card--softened" : ""} ${isLockedAdmin ? "setup-option-card--locked" : ""} ${isOpeningAdultLock ? "-translate-y-2 scale-[1.018] shadow-[0_30px_85px_rgba(245,158,11,0.24)] ring-2 ring-amber-200/80" : ""} ${isDimmedForAdultLock ? "translate-y-2 opacity-30 blur-[1px]" : ""} pressable hover-lift group flex min-h-40 flex-col rounded-[1.75rem] p-4 text-left shadow-[0_18px_55px_rgba(84,59,34,0.10)] ring-1 ring-white/80 sm:min-h-56 sm:rounded-[2.25rem] sm:p-6`}
                aria-disabled={selectedStartView !== null || isLockedAdmin || isAdultLockOpening}
                key={option.mode}
                onClick={() => chooseStartView(option)}
                type="button"
              >
                <span className="flex items-start justify-between gap-4">
                  <span className={`setup-option-icon flex size-14 items-center justify-center rounded-[1.35rem] bg-white/86 text-3xl shadow-sm ring-1 ring-black/5 transition-transform duration-500 ease-[var(--ease-out)] sm:size-20 sm:rounded-[1.6rem] sm:text-5xl ${isOpeningAdultLock ? "scale-110 rotate-[-3deg]" : ""}`}>
                    {isLockedAdmin ? "🔐" : optionIcons[option.mode]}
                  </span>
                  {!isLockedAdmin ? <span className="setup-option-check mt-1 flex size-8 items-center justify-center rounded-full bg-white/78 text-base font-black text-amber-700 opacity-80 shadow-sm ring-1 ring-black/5 transition-transform duration-150 ease-[var(--ease-out)] group-active:scale-95 sm:size-9 sm:text-lg">✓</span> : null}
                </span>
                <span className="mt-4 text-2xl font-black tracking-[-0.035em] text-stone-950 sm:mt-6 sm:text-4xl">{copy.title}</span>
                <span className="mt-2 max-w-sm text-sm font-semibold leading-6 text-stone-600 sm:mt-3 sm:text-lg sm:leading-8">{copy.description}</span>
                {isLockedAdmin ? (
                  <span className="setup-locked-chip mt-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-900">
                    <span aria-hidden="true">🔒</span>
                    {t("adultViewLockedTitle")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div> : (
          <section className="adult-view-lock-panel setup-locked-state-panel mx-auto mt-5 w-full max-w-3xl rounded-[2rem] p-5 [animation:adult-step-in_420ms_var(--ease-out)_both] sm:p-8">
            <div className="adult-view-lock-panel__shine" aria-hidden="true" />
            <div className="adult-view-lock-panel__wake" aria-hidden="true" />
            <div className="adult-view-lock-panel__icon" aria-hidden="true">🔐</div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{t("adultViewLockedTitle")}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">{t("adultViewLockedBody")}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-stone-700 sm:text-base">{t("adultViewLockedHelper")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-2 text-sm font-black text-white" onClick={() => router.push("/setup/adult")} type="button">{t("loginOrCreateHome")}</button>
              <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white/90 px-4 py-2 text-sm font-black text-stone-900" onClick={() => continueWithProfile("mobile")} type="button">{t("continueWithMobileView")}</button>
              <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white/90 px-4 py-2 text-sm font-black text-stone-900" onClick={() => continueWithProfile("wall")} type="button">{t("chooseWallView")}</button>
              <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white/70 px-4 py-2 text-sm font-black text-stone-700" onClick={() => setActiveSetupState("chooser")} type="button">{t("backToScreenChoice")}</button>
            </div>
          </section>
        )}

        {!canSelectAdultProfile(hasAdultAccess) && (isAdultLockOpening || showAdultLockedMessage) ? <p className={`mx-auto mt-2 max-w-xl text-center text-xs font-bold text-stone-600 transition-opacity duration-300 sm:text-sm ${showAdultLockedMessage ? "adult-lock-message--visible" : ""}`}>{t("adultViewLockedHelper")}</p> : null}

        <p className={`setup-footer-note mx-auto mt-4 max-w-xl text-center text-xs font-bold leading-5 text-stone-500 transition-opacity duration-300 sm:mt-7 sm:text-base sm:leading-6 ${isAdultLockOpening ? "opacity-0" : ""}`}>{t("deviceStartViewFooter")}</p>
        <div className="setup-confirmation" aria-live="polite">
          {selectedStartView ? <p>{selectedStartView.mode === "wall" ? t("deviceStartViewWallConfirmation") : t("deviceStartViewConfirmation")}</p> : null}
        </div>
      </section>
    </main>
  );
}
