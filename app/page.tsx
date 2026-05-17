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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-10">
      <section className="surface-card rounded-[3rem] p-6 backdrop-blur-sm md:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-700">HomeBoard</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-stone-950 md:text-6xl">{t("deviceStartViewSetupTitle")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-8 text-stone-600">{t("deviceStartViewSetupCopy")}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {DEVICE_START_VIEW_OPTIONS.map((option) => {
            const copy = getDeviceModeCopy(option.mode, t);

            return (
              <button
                className="pressable hover-lift flex min-h-44 flex-col rounded-[2rem] bg-white/85 p-5 text-left shadow-sm ring-1 ring-black/5"
                key={option.mode}
                onClick={() => chooseStartView(option)}
                type="button"
              >
                <span className="text-2xl font-black tracking-tight text-stone-950">{copy.title}</span>
                <span className="mt-3 text-base font-medium leading-7 text-stone-600">{copy.description}</span>
                <span className="mt-auto pt-6 text-sm font-black text-amber-700">{option.route}</span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
