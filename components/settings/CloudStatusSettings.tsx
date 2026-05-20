"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ParentAuthCard } from "@/components/auth/ParentAuthCard";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { isCloudConfigured } from "@/lib/cloud/config";
import { getDeviceProfile } from "@/lib/devicePreferences";
import { enableLocalOnlyMode, forgetSelectedCloudHouseholdOnThisDevice, isLocalOnlyModeEnabled, LOCAL_ONLY_MODE_CHANGED_EVENT, saveSelectedHouseholdId } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useCloudDiagnostics } from "@/lib/hooks/useCloudDiagnostics";
import { useParentAuth } from "@/lib/hooks/useParentAuth";
import { getLocale, useLanguage, type Language } from "@/lib/i18n";
import { householdRepository } from "@/lib/repositories/householdRepository";
import type { CloudDiagnosticsStatus } from "@/lib/repositories/cloudDiagnosticsRepository";
import { createHouseholdService } from "@/lib/services/householdService";
import type { Household } from "@/types";

const service = createHouseholdService(householdRepository);
const CLOUD_ACTIVATION_MILESTONE_DURATION_MS = 5600;
const CLOUD_ACTIVATION_STAGE_DELAYS_MS = [1250, 2600, 3950];

const activationCopy: Record<
  Language,
  {
    activationBody: string;
    activationTitle: string;
    activating: string;
    availableBody: string;
    availableTitle: string;
    cancel: string;
    chooseExisting: string;
    createCloudHome: string;
    createError: string;
    createIntro: string;
    yourName: string;
    yourNameHint: string;
    createSuccess: string;
    devOverrideBody: string;
    devOverrideTitle: string;
    existingError: string;
    cloudActivationMilestone: string;
    cloudActivationMilestoneBody: string;
    cloudActivationStepPreparing: string;
    cloudActivationStepConnecting: string;
    cloudActivationStepBuilding: string;
    cloudActivationStepActive: string;
    connectedDevice: string;
    forgetCloudHome: string;
    forgetCloudHomeBody: string;
    forgetCloudHomeConfirm: string;
    forgetCloudHomeEyebrow: string;
    forgetCloudHomeTitle: string;
    sharedCloudHome: string;
    homeName: string;
    listLoading: string;
    localBody: string;
    localTitle: string;
    mode: string;
    noHomes: string;
    notConfiguredBody: string;
    notConfiguredTitle: string;
    parentStep: string;
    stayLocal: string;
    switchError: string;
    syncActiveBody: string;
    syncActiveTitle: string;
    turnOn: string;
    useThisHome: string;
  }
> = {
  en: {
    activationBody: "We’ll keep everything on this device until a cloud home has been created or chosen. If anything fails, nothing local is removed.",
    activationTitle: "Turn on cloud sync",
    activating: "Creating…",
    availableBody: "This device is local-only right now. Turn on cloud sync when you want mobile sync and safer shared family data.",
    availableTitle: "Cloud sync can be turned on",
    cancel: "Cancel",
    chooseExisting: "Choose an existing cloud home",
    createCloudHome: "Create cloud home",
    createError: "We could not create the cloud home. Nothing local changed — you can keep using this device and try again.",
    createIntro: "Name the family home that phones and wall screens should share.",
    yourName: "Your name",
    yourNameHint: "Strongly recommended so family members see your name.",
    createSuccess: "Cloud sync is active. This device now opens the selected home.",
    devOverrideBody: "A development override is active. Normal device selection cannot change the active home until the override is removed.",
    devOverrideTitle: "Development override active",
    existingError: "We could not load your cloud homes right now. You can stay local or try again later.",
    cloudActivationMilestone: "HomeBoard is synced for the family",
    cloudActivationMilestoneBody: "This device is now connected to your shared cloud home and ready for mobile sync.",
    cloudActivationStepPreparing: "Preparing cloud sync…",
    cloudActivationStepConnecting: "Connecting this device to the home…",
    cloudActivationStepBuilding: "Building the family’s shared view…",
    cloudActivationStepActive: "Cloud sync is active",
    connectedDevice: "This device",
    forgetCloudHome: "Forget cloud home on this device",
    forgetCloudHomeBody: "This only forgets the selected home on this device. The cloud home is not deleted, and cloud tasks, members, and calendar data are not removed.",
    forgetCloudHomeConfirm: "Forget this cloud home on this device? The home is not deleted in cloud sync, and cloud tasks, members, and calendar data are not removed.",
    forgetCloudHomeEyebrow: "This device",
    forgetCloudHomeTitle: "This device can stop using the selected cloud home",
    sharedCloudHome: "Shared cloud home",
    homeName: "Home name",
    listLoading: "Loading cloud homes…",
    localBody: "Tasks and settings stay on this browser. No sign-in is required, and you can turn on cloud sync later.",
    localTitle: "Only on this device",
    mode: "Current mode",
    noHomes: "No cloud homes found for this grown-up yet. Create one to continue.",
    notConfiguredBody: "Cloud sync is not configured for this deployment yet. Local-only mode still works without sign-in.",
    notConfiguredTitle: "Cloud sync is not available here",
    parentStep: "Sign in as a grown-up so HomeBoard can create or choose a family cloud home.",
    stayLocal: "Continue only on this device",
    switchError: "We could not use that cloud home. Nothing local changed — try again in a moment.",
    syncActiveBody: "This device is using a cloud home for shared family sync.",
    syncActiveTitle: "Cloud sync active",
    turnOn: "Turn on cloud sync",
    useThisHome: "Use this home",
  },
  sv: {
    activationBody: "Vi behåller allt på den här enheten tills ett molnhem har skapats eller valts. Om något misslyckas tas inget lokalt bort.",
    activationTitle: "Aktivera molnsynk",
    activating: "Skapar…",
    availableBody: "Den här enheten kör lokalt just nu. Aktivera molnsynk när du vill synka med mobilen och spara familjens data tryggare.",
    availableTitle: "Molnsynk kan aktiveras",
    cancel: "Avbryt",
    chooseExisting: "Välj ett befintligt molnhem",
    createCloudHome: "Skapa molnhem",
    createError: "Vi kunde inte skapa molnhemmet. Inget lokalt ändrades — du kan fortsätta använda den här enheten och försöka igen.",
    createIntro: "Namnge familjens hem som mobiler och väggskärmar ska dela.",
    yourName: "Ditt namn",
    yourNameHint: "Rekommenderas starkt så familjen ser ditt namn.",
    createSuccess: "Molnsynk är aktiv. Den här enheten öppnar nu valt hem.",
    devOverrideBody: "En utvecklingsoverride är aktiv. Vanligt enhetsval kan inte ändra aktivt hem förrän overriden tas bort.",
    devOverrideTitle: "Utvecklingsoverride aktiv",
    existingError: "Vi kunde inte ladda dina molnhem just nu. Du kan fortsätta lokalt eller försöka igen senare.",
    cloudActivationMilestone: "HomeBoard är synkat för familjen",
    cloudActivationMilestoneBody: "Den här enheten är nu kopplad till ert delade molnhem och redo för mobilsynk.",
    cloudActivationStepPreparing: "Förbereder molnsynk…",
    cloudActivationStepConnecting: "Kopplar den här enheten till hemmet…",
    cloudActivationStepBuilding: "Bygger familjens gemensamma vy…",
    cloudActivationStepActive: "Molnsynk är aktiv",
    connectedDevice: "Den här enheten",
    forgetCloudHome: "Glöm molnhem på den här enheten",
    forgetCloudHomeBody: "Detta glömmer bara valt hem på den här enheten. Hemmet raderas inte i molnet, och uppgifter, medlemmar och kalenderdata i molnet tas inte bort.",
    forgetCloudHomeConfirm: "Glöm det här molnhemmet på den här enheten? Hemmet raderas inte i molnsynk, och uppgifter, medlemmar och kalenderdata i molnet tas inte bort.",
    forgetCloudHomeEyebrow: "Den här enheten",
    forgetCloudHomeTitle: "Den här enheten kan sluta använda valt molnhem",
    sharedCloudHome: "Delat molnhem",
    homeName: "Namn på hemmet",
    listLoading: "Laddar molnhem…",
    localBody: "Uppgifter och inställningar stannar i den här webbläsaren. Ingen inloggning krävs, och du kan aktivera molnsynk senare.",
    localTitle: "Endast på den här enheten",
    mode: "Nuvarande läge",
    noHomes: "Inga molnhem hittades för den här vuxna ännu. Skapa ett för att fortsätta.",
    notConfiguredBody: "Molnsynk är inte konfigurerat för den här installationen ännu. Lokalt läge fungerar fortsatt utan inloggning.",
    notConfiguredTitle: "Molnsynk är inte tillgängligt här",
    parentStep: "Logga in som vuxen så att HomeBoard kan skapa eller välja ett familjens molnhem.",
    stayLocal: "Fortsätt bara på den här enheten",
    switchError: "Vi kunde inte använda det molnhemmet. Inget lokalt ändrades — försök igen om en stund.",
    syncActiveBody: "Den här enheten använder ett molnhem för delad familjesynk.",
    syncActiveTitle: "Molnsynk aktiv",
    turnOn: "Aktivera molnsynk",
    useThisHome: "Använd det här hemmet",
  },
};

function maskId(id: string | null) {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function CloudStatusSettings() {
  const { diagnostics, isLoading, refresh } = useCloudDiagnostics();
  const { household, householdId, isDevOverride, refreshHouseholdId, selectedHouseholdId } = useActiveHousehold();
  const { isLoading: isParentLoading, isSignedIn, signOut, user } = useParentAuth();
  const { language, t } = useLanguage();
  const copy = activationCopy[language];
  const [isLocalOnly, setLocalOnly] = useState(() => isLocalOnlyModeEnabled());
  const [isActivating, setActivating] = useState(false);
  const [householdName, setHouseholdName] = useState(language === "sv" ? "Vårt hem" : "Our Home");
  const [households, setHouseholds] = useState<Household[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [isLoadingHouseholds, setLoadingHouseholds] = useState(false);
  const [isCreatingHousehold, setCreatingHousehold] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isForgetConfirming, setForgetConfirming] = useState(false);
  const [isCloudActivationCelebrating, setCloudActivationCelebrating] = useState(false);
  const [cloudActivationStage, setCloudActivationStage] = useState(0);

  const status = diagnostics?.status ?? "not_configured";
  const isConfigured = isCloudConfigured();
  const canUseCloud = isConfigured && !isDevOverride;
  const hasCloudHousehold = Boolean(householdId);
  const canForgetSelectedCloudHousehold = Boolean(selectedHouseholdId) && !isDevOverride;
  const tone = status === "active" ? "emerald" : status === "unreachable" ? "rose" : "amber";
  const statusLabels: Record<CloudDiagnosticsStatus, string> = {
    active: t("cloudSyncActive"),
    not_configured: t("cloudSyncNotConfigured"),
    unreachable: t("cloudSyncUnreachable"),
  };
  const cloudSyncLabel = isConfigured && !hasCloudHousehold ? (isLocalOnly ? copy.localTitle : copy.availableTitle) : statusLabels[status];
  const checkedAt = diagnostics?.checkedAt ? new Intl.DateTimeFormat(getLocale(language), { dateStyle: "short", timeStyle: "short" }).format(new Date(diagnostics.checkedAt)) : "—";
  const cloudActivationSteps = [copy.cloudActivationStepPreparing, copy.cloudActivationStepConnecting, copy.cloudActivationStepBuilding, copy.cloudActivationStepActive];
  const cloudActivationStageCopy = cloudActivationSteps[cloudActivationStage] ?? copy.cloudActivationMilestone;

  const mode = useMemo<{ title: string; body: string; tone: "amber" | "emerald" | "rose" | "stone" | "dark" }>(() => {
    if (isDevOverride) return { title: copy.devOverrideTitle, body: copy.devOverrideBody, tone: "amber" as const };
    if (!isConfigured) return { title: copy.notConfiguredTitle, body: copy.notConfiguredBody, tone: "amber" as const };
    if (hasCloudHousehold) return { title: status === "unreachable" ? t("cloudSyncUnreachable") : copy.syncActiveTitle, body: status === "unreachable" ? t("cloudUnavailableBody") : copy.syncActiveBody, tone };
    if (isLocalOnly) return { title: copy.localTitle, body: copy.localBody, tone: "amber" as const };
    return { title: copy.availableTitle, body: copy.availableBody, tone: "amber" as const };
  }, [copy, hasCloudHousehold, isConfigured, isDevOverride, isLocalOnly, status, t, tone]);

  useEffect(() => {
    const refreshLocalOnly = () => setLocalOnly(isLocalOnlyModeEnabled());
    window.addEventListener(LOCAL_ONLY_MODE_CHANGED_EVENT, refreshLocalOnly);
    window.addEventListener("storage", refreshLocalOnly);
    return () => {
      window.removeEventListener(LOCAL_ONLY_MODE_CHANGED_EVENT, refreshLocalOnly);
      window.removeEventListener("storage", refreshLocalOnly);
    };
  }, []);

  useEffect(() => {
    if (!isCloudActivationCelebrating) return;

    setCloudActivationStage(0);
    const stageTimers = CLOUD_ACTIVATION_STAGE_DELAYS_MS.map((delay, index) => window.setTimeout(() => setCloudActivationStage(index + 1), delay));
    const celebrationTimer = window.setTimeout(() => setCloudActivationCelebrating(false), CLOUD_ACTIVATION_MILESTONE_DURATION_MS);
    return () => {
      stageTimers.forEach(window.clearTimeout);
      window.clearTimeout(celebrationTimer);
    };
  }, [isCloudActivationCelebrating]);

  useEffect(() => {
    if (!isActivating || !canUseCloud || !isSignedIn) return;

    let isMounted = true;
    setLoadingHouseholds(true);
    setFlowError(null);

    service
      .listHouseholds()
      .then((nextHouseholds) => {
        if (isMounted) setHouseholds(nextHouseholds);
      })
      .catch((error) => {
        console.warn("HomeBoard could not list cloud homes from Settings.", error);
        if (isMounted) {
          setHouseholds([]);
          setFlowError(copy.existingError);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingHouseholds(false);
      });

    return () => {
      isMounted = false;
    };
  }, [canUseCloud, copy.existingError, isActivating, isSignedIn]);

  function startActivation() {
    setActivating(true);
    setForgetConfirming(false);
    setFlowError(null);
    setCloudActivationCelebrating(false);
    setCloudActivationStage(0);
  }

  function cancelActivation() {
    setActivating(false);
    setFlowError(null);
  }

  function continueLocalOnly() {
    enableLocalOnlyMode();
    refreshHouseholdId();
    setLocalOnly(true);
    setActivating(false);
    setForgetConfirming(false);
    setFlowError(null);
    setCloudActivationCelebrating(false);
    setCloudActivationStage(0);
  }

  function forgetCloudHomeOnThisDevice() {
    if (getDeviceProfile() === "wall") void signOut();
    forgetSelectedCloudHouseholdOnThisDevice();
    enableLocalOnlyMode();
    refreshHouseholdId();
    setLocalOnly(true);
    setActivating(false);
    setForgetConfirming(false);
    setFlowError(null);
    setCloudActivationCelebrating(false);
    setCloudActivationStage(0);
    void refresh();
  }

  function finishWithHousehold(nextHouseholdId: string) {
    saveSelectedHouseholdId(nextHouseholdId);
    refreshHouseholdId();
    setLocalOnly(false);
    setActivating(false);
    setForgetConfirming(false);
    setFlowError(null);
    setCloudActivationStage(0);
    setCloudActivationCelebrating(true);
    void refresh();
  }

  function chooseHousehold(nextHouseholdId: string) {
    try {
      finishWithHousehold(nextHouseholdId);
    } catch (error) {
      console.warn("HomeBoard could not choose a cloud home from Settings.", error);
      setFlowError(copy.switchError);
    }
  }

  async function createCloudHome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = householdName.trim();
    if (!name || !isSignedIn || !user) return;

    setCreatingHousehold(true);
    setFlowError(null);
    try {
      const nextHousehold = await service.createHousehold({ name, ownerUserId: user.id });
      await service.createHouseholdMembers(nextHousehold.id, [
        {
          displayName: ownerName.trim() || (language === "sv" ? "Vuxen" : "Grown-up"),
          color: "#f97316",
          role: "adult",
          userId: user.id,
        },
      ]);
      finishWithHousehold(nextHousehold.id);
    } catch (error) {
      console.warn("HomeBoard could not create a cloud home from Settings.", error);
      setFlowError(copy.createError);
    } finally {
      setCreatingHousehold(false);
    }
  }

  return (
    <SettingsCard status={hasCloudHousehold ? t("cloudConnected") : t("onlyOnThisDevice")} title={t("cloudStatus")}>
      <div className="space-y-4">
        <p>{t("cloudStatusCopy")}</p>

        {(!hasCloudHousehold || isCloudActivationCelebrating) ? (
        <div className={`cloud-mode-card ${isCloudActivationCelebrating ? `cloud-mode-card--celebrating cloud-mode-card--stage-${cloudActivationStage}` : "cloud-mode-card--local"}`}>
          <div className="cloud-mode-card__shine" />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{isCloudActivationCelebrating ? t("cloudSync") : copy.mode}</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-stone-950">{isCloudActivationCelebrating ? cloudActivationStageCopy : mode.title}</h3>
            </div>
            <StatusChip tone={isCloudActivationCelebrating && cloudActivationStage >= 3 ? "emerald" : mode.tone}>{isCloudActivationCelebrating && cloudActivationStage >= 3 ? t("cloudSyncActive") : mode.title}</StatusChip>
          </div>
          <p className="relative mt-2 text-sm font-semibold leading-6 text-stone-700">{isCloudActivationCelebrating ? copy.cloudActivationMilestoneBody : mode.body}</p>
          {isCloudActivationCelebrating ? (
            <div className="cloud-milestone-stage" aria-live="polite">
              <div className="cloud-connection-path" aria-hidden="true">
                <span>{copy.connectedDevice}</span>
                <i />
                <i />
                <i />
                <span>{copy.sharedCloudHome}</span>
              </div>
              <ol className="cloud-milestone-steps">
                {cloudActivationSteps.map((step, index) => (
                  <li className={index <= cloudActivationStage ? "cloud-milestone-step cloud-milestone-step--active" : "cloud-milestone-step"} key={step}>
                    <span />
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {!hasCloudHousehold && canUseCloud ? (
            <button className="pressable relative mt-4 min-h-11 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white shadow-sm shadow-stone-950/10" onClick={startActivation} type="button">
              {copy.turnOn}
            </button>
          ) : null}
        </div>
        ) : null}


        {isActivating ? (
          <div className="rounded-[1.7rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{t("cloudSync")}</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-stone-950">{copy.activationTitle}</h3>
              </div>
              <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" onClick={cancelActivation} type="button">
                {copy.cancel}
              </button>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{copy.activationBody}</p>

            {isParentLoading ? <p className="mt-4 text-sm font-bold text-stone-600">{t("loading")}</p> : null}
            {!isParentLoading && !isSignedIn ? (
              <div className="mt-4 space-y-3">
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">{copy.parentStep}</p>
                <ParentAuthCard compact />
              </div>
            ) : null}

            {isSignedIn ? (
              <div className="mt-5 grid gap-4">
                <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                  <h4 className="text-base font-black text-stone-950">{copy.createCloudHome}</h4>
                  <p className="mt-1 text-sm font-semibold leading-6 text-stone-600">{copy.createIntro}</p>
                  <form className="mt-4 space-y-3" onSubmit={createCloudHome}>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{copy.homeName}</span>
                      <p className="mt-1 text-xs font-bold text-stone-500">{copy.yourNameHint}</p>
                      <input
                        className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
                        disabled={isCreatingHousehold}
                        onChange={(event) => setHouseholdName(event.target.value)}
                        required
                        value={householdName}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{copy.yourName}</span>
                      <input
                        className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
                        disabled={isCreatingHousehold}
                        onChange={(event) => setOwnerName(event.target.value)}
                        value={ownerName}
                      />
                    </label>
                    <button className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60" disabled={isCreatingHousehold} type="submit">
                      {isCreatingHousehold ? copy.activating : copy.createCloudHome}
                    </button>
                  </form>
                </section>

                <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                  <h4 className="text-base font-black text-stone-950">{copy.chooseExisting}</h4>
                  {isLoadingHouseholds ? <p className="mt-2 text-sm font-bold text-stone-600">{copy.listLoading}</p> : null}
                  {!isLoadingHouseholds && households.length === 0 ? <p className="mt-2 text-sm font-bold text-stone-600">{copy.noHomes}</p> : null}
                  <div className="mt-3 grid gap-2">
                    {households.map((nextHousehold) => (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3" key={nextHousehold.id}>
                        <div>
                          <p className="font-black text-stone-950">{nextHousehold.name}</p>
                          <p className="font-mono text-xs font-bold text-stone-500">{maskId(nextHousehold.id)}</p>
                        </div>
                        <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" onClick={() => chooseHousehold(nextHousehold.id)} type="button">
                          {copy.useThisHome}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <button className="pressable min-h-11 justify-self-start rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-800 shadow-sm" onClick={continueLocalOnly} type="button">
                  {copy.stayLocal}
                </button>
              </div>
            ) : null}

            {flowError ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-950">{flowError}</p> : null}
          </div>
        ) : null}

        
        <details className="rounded-2xl border border-stone-200/80 bg-white/75 p-4 text-sm">
          <summary className="cursor-pointer font-black text-stone-800">{t("technicalInfo")}</summary>
          <dl className="mt-3 grid gap-2 rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("cloudSync")}</dt>
            <dd className="text-right font-black text-stone-900">
              <StatusChip tone={tone}>{isLoading ? t("loading") : cloudSyncLabel}</StatusChip>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("home")}</dt>
            <dd className="text-right font-black text-stone-900">{diagnostics?.householdName ?? household?.name ?? t("notSelected")}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("members")}</dt>
            <dd className="text-right font-black text-stone-900">{diagnostics?.memberCount ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("cloudTasksCount")}</dt>
            <dd className="text-right font-black text-stone-900">{diagnostics?.taskCount ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("cloudCalendarEventsCount")}</dt>
            <dd className="text-right font-black text-stone-900">{diagnostics?.calendarEventCount ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("lastChecked")}</dt>
            <dd className="text-right font-black text-stone-900">{checkedAt}</dd>
          </div>
        </dl>
        </details>
        {status === "unreachable" ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-950">{t("cloudUnavailableBody")}</p> : null}
        <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-800 shadow-sm" disabled={isLoading} onClick={refresh} type="button">
          {t("refreshCloudStatus")}
        </button>
        
      </div>
    </SettingsCard>
  );
}
