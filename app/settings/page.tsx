"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarSourcesSettings } from "@/components/settings/CalendarSourcesSettings";
import { CloudStatusSettings } from "@/components/settings/CloudStatusSettings";
import { DeviceStartViewSettings } from "@/components/settings/DeviceStartViewSettings";
import { HouseholdSettings } from "@/components/settings/HouseholdSettings";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { WallTaskCreatorSettings } from "@/components/settings/WallTaskCreatorSettings";
import { MembersSettings } from "@/components/settings/MembersSettings";
import { DevicesSettings } from "@/components/settings/DevicesSettings";
import { consumePendingFirstRunReveal, hasPendingFirstRunReveal } from "@/lib/firstRunReveal";
import { canManageDeviceLocalSettings, canManageHouseholdSettings, getDeviceProfile, getOrCreateDeviceId, resetDeviceProfile, setDeviceProfile as persistDeviceProfile, type DeviceMode } from "@/lib/devicePreferences";
import { useAdultAccess } from "@/lib/hooks/useAdultAccess";
import { useLanguage, type Language } from "@/lib/i18n";

export default function SettingsPage() {
  const router = useRouter();
  const { language, languageName, setLanguage, t } = useLanguage();
  const [isFirstRunRevealActive] = useState(() => hasPendingFirstRunReveal("settings"));
  const [deviceProfile, setDeviceProfileState] = useState<DeviceMode | null>(null);
  const { hasAdultAccess } = useAdultAccess();
  const hasHouseholdSettings = canManageHouseholdSettings(deviceProfile, hasAdultAccess);
  const hasDeviceLocalSettings = canManageDeviceLocalSettings(deviceProfile);
  const canShowWallTaskCreatorSettings = hasDeviceLocalSettings;
  const showWallLimitedNotice = deviceProfile === "wall" && !hasHouseholdSettings;

  useEffect(() => {
    getOrCreateDeviceId();
    consumePendingFirstRunReveal("settings");
    setDeviceProfileState(getDeviceProfile());
  }, []);

  const continueWithProfile = (nextProfile: Exclude<DeviceMode, "admin">, route: "/app" | "/wall") => {
    const nextStartView = persistDeviceProfile(nextProfile);
    setDeviceProfileState(nextStartView.mode);
    router.push(route);
  };

  const chooseScreenAgain = () => {
    resetDeviceProfile();
    setDeviceProfileState(null);
    router.push("/");
  };

  return (
    <AppShell eyebrow={t("settingsEyebrow")} revealActive={isFirstRunRevealActive} title={t("settings")}>
      <div className={`space-y-3 sm:space-y-4 ${isFirstRunRevealActive ? "settings-reveal-grid" : ""}`}>
        <SettingsSection
          defaultOpen
          description={language === "sv" ? "Språk, startvy och lokala val." : "Language, start view, and local choices."}
          eyebrow={language === "sv" ? "Inställningar" : "Settings"}
          title={language === "sv" ? "Enheten" : "Device"}
        >
          <SettingsCard status={t("localPreview")} title={t("language")}>
            <div className="space-y-3">
              <p>{t("languageCopy")}</p>
              <label className="block text-xs font-black uppercase tracking-[0.18em] text-stone-500" htmlFor="language-select">{t("selectedLanguage")}</label>
              <select className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 font-bold text-stone-900 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500" id="language-select" onChange={(event) => setLanguage(event.target.value as Language)} value={language}>
                <option value="en">English</option><option value="sv">Svenska</option>
              </select>
              <p className="font-bold text-stone-800">{languageName}</p>
            </div>
          </SettingsCard>
          <DeviceStartViewSettings onProfileChange={setDeviceProfileState} />
          {showWallLimitedNotice ? (
            <p className="rounded-2xl border border-stone-200/80 bg-stone-50 px-4 py-3 text-sm font-semibold leading-6 text-stone-700 md:col-span-2">{language === "sv" ? "Du ändrar bara den här väggskärmen. Logga in som vuxen för hem, medlemmar och kopplade enheter." : "You’re only changing this wall screen. Sign in as an adult to manage the home, members, and connected devices."}</p>
          ) : null}
        </SettingsSection>

        {deviceProfile === "admin" && !hasAdultAccess ? (
          <div className="adult-view-lock-panel rounded-[2rem] p-5">
            <div className="adult-view-lock-panel__shine" aria-hidden="true" />
            <div className="adult-view-lock-panel__wake" aria-hidden="true" />
            <div className="adult-view-lock-panel__icon" aria-hidden="true">🔐</div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{t("adultViewLockedTitle")}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-950">{t("adultViewLockedBody")}</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-700">{t("adultViewLockedHelper")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-2 text-sm font-black text-white" onClick={() => continueWithProfile("mobile", "/app")} type="button">{t("continueWithMobileView")}</button>
              <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white/90 px-4 py-2 text-sm font-black text-stone-900" onClick={() => continueWithProfile("wall", "/wall")} type="button">{t("chooseWallView")}</button>
              <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white/70 px-4 py-2 text-sm font-black text-stone-700" onClick={chooseScreenAgain} type="button">{t("backToScreenChoice")}</button>
            </div>
          </div>
        ) : null}

        <SettingsSection
          description={language === "sv" ? "Se om hemmet är synkat i molnet eller bara används på den här enheten." : "See whether your home is synced in cloud or used only on this device."}
          eyebrow={language === "sv" ? "Synk" : "Sync"}
          title={language === "sv" ? "Moln & synk" : "Cloud & sync"}
        >
          <CloudStatusSettings />
        </SettingsSection>

        {hasHouseholdSettings ? (
          <SettingsSection
            description={language === "sv" ? "Hantera familjens hem, medlemmar och enheter." : "Manage your family home, members, and connected devices."}
            eyebrow={language === "sv" ? "Hushåll" : "Household"}
            title={language === "sv" ? "Hem" : "Home"}
          >
            <HouseholdSettings />
            <MembersSettings />
            <DevicesSettings />
          </SettingsSection>
        ) : null}

        {hasHouseholdSettings ? (
          <SettingsSection
            description={language === "sv" ? "Kalenderkällor och synkstatus för familjens planering." : "Calendar sources and sync status for family planning."}
            title={language === "sv" ? "Kalender" : "Calendar"}
          >
            <CalendarSourcesSettings />
          </SettingsSection>
        ) : null}

        {canShowWallTaskCreatorSettings ? (
          <SettingsSection
            description={language === "sv" ? "Val som påverkar hur väggskärmen visar och skapar uppgifter." : "Choices that affect how the wall screen displays and creates tasks."}
            title={language === "sv" ? "Väggskärm" : "Wall screen"}
          >
            <WallTaskCreatorSettings />
          </SettingsSection>
        ) : null}

        {hasHouseholdSettings ? (
          <SettingsSection
            description={language === "sv" ? "Avancerade kopplingar till andra system. Frivilligt och planerat." : "Advanced connections to other systems. Optional and planned."}
            title={language === "sv" ? "Integrationer" : "Integrations"}
          >
            <SettingsCard status={t("planned")} title={t("homeAssistantIntegration")}><p>{t("homeAssistantIntegrationCopy")}</p></SettingsCard>
            <SettingsCard status={t("planned")} title={t("runaiApiTokens")}><p>{t("runaiApiTokensCopy")}</p></SettingsCard>
          </SettingsSection>
        ) : null}

        {deviceProfile !== "wall" ? (
          <SettingsSection
            description={language === "sv" ? "Teknisk information för felsökning och utveckling." : "Technical information for troubleshooting and development."}
            title={language === "sv" ? "Tekniskt" : "Technical"}
          >
            <SettingsCard status={t("localPreview")} title={language === "sv" ? "Förhandsläge" : "Preview mode"}>
              <p>{language === "sv" ? "HomeBoard använder lokal lagring i förhandsläget. Delning mellan enheter kräver molnsynk." : "HomeBoard uses local storage in preview mode. Sharing across devices requires cloud sync."}</p>
            </SettingsCard>
          </SettingsSection>
        ) : null}
      </div>
    </AppShell>
  );
}
