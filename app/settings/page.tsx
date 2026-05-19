"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarSourcesSettings } from "@/components/settings/CalendarSourcesSettings";
import { CloudStatusSettings } from "@/components/settings/CloudStatusSettings";
import { DeviceStartViewSettings } from "@/components/settings/DeviceStartViewSettings";
import { HouseholdSettings } from "@/components/settings/HouseholdSettings";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { WallTaskCreatorSettings } from "@/components/settings/WallTaskCreatorSettings";
import { MembersSettings } from "@/components/settings/MembersSettings";
import { consumePendingFirstRunReveal, hasPendingFirstRunReveal } from "@/lib/firstRunReveal";
import Link from "next/link";
import { ADULT_ACCESS_REQUIRED_REASON, canAccessFullSettings, getDeviceProfile, getOrCreateDeviceId, setDeviceProfile, type DeviceMode } from "@/lib/devicePreferences";
import { useAdultAccess } from "@/lib/hooks/useAdultAccess";
import { useLanguage, type Language } from "@/lib/i18n";

export default function SettingsPage() {
  const { language, languageName, setLanguage, t } = useLanguage();
  const [isFirstRunRevealActive] = useState(() => hasPendingFirstRunReveal("settings"));
  const [deviceProfile, setDeviceProfile] = useState<DeviceMode | null>(null);
  const { hasAdultAccess } = useAdultAccess();
  const hasFullSettings = canAccessFullSettings(deviceProfile, hasAdultAccess);

  useEffect(() => {
    getOrCreateDeviceId();
    consumePendingFirstRunReveal("settings");
    setDeviceProfile(getDeviceProfile());
  }, []);

  return (
    <AppShell eyebrow={t("settingsEyebrow")} revealActive={isFirstRunRevealActive} title={t("settings")}>
      <div className={`grid gap-4 md:grid-cols-2 ${isFirstRunRevealActive ? "settings-reveal-grid" : ""}`}>
        <SettingsCard status={t("localPreview")} title={t("language")}>
          <div className="space-y-3">
            <p>{t("languageCopy")}</p>
            <label className="block text-xs font-black uppercase tracking-[0.18em] text-stone-500" htmlFor="language-select">
              {t("selectedLanguage")}
            </label>
            <select
              className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 font-bold text-stone-900 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
              id="language-select"
              onChange={(event) => setLanguage(event.target.value as Language)}
              value={language}
            >
              <option value="en">English</option>
              <option value="sv">Svenska</option>
            </select>
            <p className="font-bold text-stone-800">{languageName}</p>
          </div>
        </SettingsCard>
        <DeviceStartViewSettings onProfileChange={setDeviceProfile} />
        <CloudStatusSettings />
        {deviceProfile === "admin" && !hasAdultAccess ? (
          <div className="adult-view-lock-panel md:col-span-2 rounded-[2rem] p-5">
            <div className="adult-view-lock-panel__shine" aria-hidden="true" />
            <div className="adult-view-lock-panel__wake" aria-hidden="true" />
            <div className="adult-view-lock-panel__icon" aria-hidden="true">🔐</div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{t("adultViewLockedTitle")}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-950">{t("adultViewLockedBody")}</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-700">{t("adultViewLockedHelper")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-2 text-sm font-black text-white" href="/app" onClick={() => setDeviceProfile("mobile")}>{t("continueWithMobileView")}</Link>
              <Link className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white/90 px-4 py-2 text-sm font-black text-stone-900" href="/wall" onClick={() => setDeviceProfile("wall")}>{t("chooseWallView")}</Link>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">Code: {ADULT_ACCESS_REQUIRED_REASON}</p>
          </div>
        ) : null}
        {hasFullSettings ? (
          <>
            <HouseholdSettings />
            <MembersSettings />
            <WallTaskCreatorSettings />
            <CalendarSourcesSettings />
            <SettingsCard status={t("planned")} title={t("homeAssistantIntegration")}>
              <p>{t("homeAssistantIntegrationCopy")}</p>
            </SettingsCard>
            <SettingsCard status={t("localPreview")} title={t("dueDate")}>
              <div className="space-y-2">
                <p>{t("dueDatePreview")}</p>
                <p>{t("futureSchedulingPreview")}</p>
              </div>
            </SettingsCard>
            <SettingsCard status={t("planned")} title={t("runaiApiTokens")}>
              <p>{t("runaiApiTokensCopy")}</p>
            </SettingsCard>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
