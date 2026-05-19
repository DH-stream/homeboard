"use client";

import { useEffect, useState } from "react";
import {
  canSelectAdultProfile,
  ADULT_ACCESS_REQUIRED_REASON,
  getOrCreateDeviceId,
  DEVICE_START_VIEW_OPTIONS,
  readDeviceStartView,
  resetDeviceProfile,
  setDeviceProfile,
  type DeviceMode,
  type DeviceStartView,
} from "@/lib/devicePreferences";
import { useLanguage } from "@/lib/i18n";
import { useAdultAccess } from "@/lib/hooks/useAdultAccess";
import { SettingsCard } from "./SettingsCard";

function getDeviceModeLabel(mode: DeviceMode, t: ReturnType<typeof useLanguage>["t"]) {
  if (mode === "wall") return t("deviceModeWall");
  if (mode === "admin") return t("deviceModeAdmin");
  return t("deviceModeMobile");
}

export function DeviceStartViewSettings({ onProfileChange }: { onProfileChange?: (profile: DeviceMode | null) => void }) {
  const { t } = useLanguage();
  const { hasAdultAccess } = useAdultAccess();
  const [startView, setStartView] = useState<DeviceStartView | null>(null);

  useEffect(() => {
    getOrCreateDeviceId();
    setStartView(readDeviceStartView());
  }, []);

  const updateMode = (mode: DeviceMode) => {
    if (mode === "admin" && !canSelectAdultProfile(hasAdultAccess)) return;
    const nextStartView = setDeviceProfile(mode);
    setStartView(nextStartView);
    onProfileChange?.(nextStartView.mode);
  };

  const resetStartView = () => {
    resetDeviceProfile();
    setStartView(null);
    onProfileChange?.(null);
  };

  return (
    <SettingsCard status={t("localPreview")} title={t("deviceStartViewTitle")}>
      <div className="space-y-4">
        <p>{t("deviceStartViewCopy")}</p>

        <dl className="rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("defaultRoute")}</dt>
            <dd className="text-right font-black text-stone-900">{startView ? getDeviceModeLabel(startView.mode, t) : t("deviceModeUnset")}</dd>
          </div>
        </dl>

        <label className="block text-xs font-black uppercase tracking-[0.18em] text-stone-500" htmlFor="device-mode-select">
          {t("defaultRoute")}
        </label>
        <select
          className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 font-bold text-stone-900 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
          id="device-mode-select"
          onChange={(event) => updateMode(event.target.value as DeviceMode)}
          value={startView?.mode ?? ""}
        >
          <option value="" disabled>
            {t("deviceModeUnset")}
          </option>
          {DEVICE_START_VIEW_OPTIONS.map((option) => (
            <option disabled={option.mode === "admin" && !canSelectAdultProfile(hasAdultAccess)} key={option.mode} value={option.mode}>
              {getDeviceModeLabel(option.mode, t)}
            </option>
          ))}
        </select>

        {!canSelectAdultProfile(hasAdultAccess) ? (
          <div className="adult-view-lock-panel rounded-[1.4rem] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">{t("adultViewLockedTitle")}</p>
            <p className="mt-2 text-base font-black tracking-tight text-stone-950">{t("adultViewLockedBody")}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-700">{t("adultViewLockedHelper")}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">Code: {ADULT_ACCESS_REQUIRED_REASON}</p>
          </div>
        ) : null}

        <div className="rounded-2xl bg-amber-50 p-4 text-amber-950 ring-1 ring-amber-100">
          <p className="font-black">{t("deviceStartViewSaved")}</p>
          <p className="mt-1 text-sm leading-6">{t("deviceStartViewResetCopy")}</p>
        </div>

        <button
          className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-45"
          disabled={!startView}
          onClick={resetStartView}
          type="button"
        >
          {t("deviceStartViewReset")}
        </button>
      </div>
    </SettingsCard>
  );
}
