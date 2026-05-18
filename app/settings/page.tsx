"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarSourcesSettings } from "@/components/settings/CalendarSourcesSettings";
import { CloudStatusSettings } from "@/components/settings/CloudStatusSettings";
import { DeviceStartViewSettings } from "@/components/settings/DeviceStartViewSettings";
import { HouseholdSettings } from "@/components/settings/HouseholdSettings";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { WallTaskCreatorSettings } from "@/components/settings/WallTaskCreatorSettings";
import { consumePendingFirstRunReveal, hasPendingFirstRunReveal } from "@/lib/firstRunReveal";
import { useLanguage, type Language } from "@/lib/i18n";

export default function SettingsPage() {
  const { language, languageName, setLanguage, t } = useLanguage();
  const [isFirstRunRevealActive] = useState(() => hasPendingFirstRunReveal("settings"));

  useEffect(() => {
    consumePendingFirstRunReveal("settings");
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
        <DeviceStartViewSettings />
        <WallTaskCreatorSettings />
        <HouseholdSettings />
        <CloudStatusSettings />
        <SettingsCard status={t("mock")} title={t("members")}>
          <p>{t("membersCopy")}</p>
        </SettingsCard>
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
        <SettingsCard status={t("previewMode")} title={t("dataBackendStatus")}>
          <div className="space-y-3">
            <p className="font-bold text-stone-800">{t("noCloudSync")}</p>
            <dl className="grid gap-2 rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-stone-500">{t("uiTaskState")}</dt>
                <dd className="text-right font-black text-stone-900">{t("browserLocalStorage")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-stone-500">{t("apiTaskState")}</dt>
                <dd className="text-right font-black text-stone-900">{t("temporaryInMemory")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-stone-500">{t("multiDeviceSync")}</dt>
                <dd className="text-right font-black text-amber-700">{t("notConnectedYet")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-stone-500">{t("nextBackendTarget")}</dt>
                <dd className="text-right font-black text-stone-900">{t("sharedCloud")}</dd>
              </div>
            </dl>
            <p>{t("storageClarification")}</p>
          </div>
        </SettingsCard>
      </div>
    </AppShell>
  );
}
