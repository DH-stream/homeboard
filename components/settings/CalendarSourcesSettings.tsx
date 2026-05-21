"use client";

import { useEffect, useMemo, useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { useCalendarSettings } from "@/lib/hooks/useCalendarSettings";
import { useLanguage } from "@/lib/i18n";
import type { CalendarSource } from "@/types";

const maskUrl = (url?: string) => (url ? `${url.slice(0, 24)}••••` : "");
type ProviderChoice = "apple" | "google" | "microsoft" | "link";
type SyncVisualPhase = "idle" | "queued" | "syncing" | "success";
const CALENDAR_MILESTONE_DURATION_MS = 5600;
const CALENDAR_MILESTONE_STAGE_DELAYS_MS = [1250, 2600, 3950];
const SYNC_MIN_SPINNER_VISIBLE_MS = 1100;
const SYNC_SUCCESS_OVERLAP_MS = 420;
const SYNC_SUCCESS_VISIBLE_MS = 2900;

const PROVIDER_CHOICES: Array<{ choice: ProviderChoice; icon: string; labelKey: "calendarProviderApple" | "calendarProviderGoogle" | "calendarProviderMicrosoft" | "calendarProviderLink"; description: { en: string; sv: string } }> = [
  { choice: "apple", icon: "A", labelKey: "calendarProviderApple", description: { en: "For iPhone, iPad and iCloud.", sv: "För iPhone, iPad och iCloud." } },
  { choice: "google", icon: "G", labelKey: "calendarProviderGoogle", description: { en: "For Gmail and Google Calendar.", sv: "För Gmail och Google Kalender." } },
  { choice: "microsoft", icon: "M", labelKey: "calendarProviderMicrosoft", description: { en: "For Outlook, Hotmail and Microsoft 365.", sv: "För Outlook, Hotmail och Microsoft 365." } },
  { choice: "link", icon: "↗", labelKey: "calendarProviderLink", description: { en: "For a shared calendar link.", sv: "För en delad kalenderlänk." } },
];

const COLOR_PRESETS = [
  { value: "#f59e0b", label: { en: "Amber", sv: "Amber" } },
  { value: "#10b981", label: { en: "Emerald", sv: "Emerald" } },
  { value: "#0ea5e9", label: { en: "Sky", sv: "Sky" } },
  { value: "#8b5cf6", label: { en: "Violet", sv: "Violet" } },
  { value: "#f43f5e", label: { en: "Rose", sv: "Rose" } },
  { value: "#44403c", label: { en: "Stone", sv: "Stone" } },
];

function formatLastSynced(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return new Date(value).toLocaleString();
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForMinimumSyncVisualDuration() {
  return wait(SYNC_MIN_SPINNER_VISIBLE_MS);
}

export function CalendarSourcesSettings() {
  const { language, t } = useLanguage();
  const { sources, setupState, isLoading, isSyncing, syncError, addSourceAndSync, updateSourceEnabled, removeSource, syncSource } = useCalendarSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState<ProviderChoice>("apple");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#f59e0b");
  const [activeSyncSourceId, setActiveSyncSourceId] = useState<string | null>(null);
  const [queuedSyncSourceIds, setQueuedSyncSourceIds] = useState<string[]>([]);
  const [successSyncSourceIds, setSuccessSyncSourceIds] = useState<string[]>([]);
  const [isWaterfallRunning, setWaterfallRunning] = useState(false);
  const [isCalendarMilestoneCelebrating, setCalendarMilestoneCelebrating] = useState(false);
  const [calendarMilestoneStage, setCalendarMilestoneStage] = useState(0);
  const [pendingRemovalSourceId, setPendingRemovalSourceId] = useState<string | null>(null);
  const [isRemovingSourceId, setRemovingSourceId] = useState<string | null>(null);
  const [removeFeedback, setRemoveFeedback] = useState<string | null>(null);

  const providerHelpByChoice = {
    apple: t("calendarProviderAppleHelp"),
    google: t("calendarProviderGoogleHelp"),
    microsoft: t("calendarProviderMicrosoftHelp"),
    link: t("calendarProviderLinkHelp"),
  } as const;

  const text = {
    activeSource: language === "sv" ? "Aktiv kalenderkälla" : "active calendar source",
    autoNote: language === "sv" ? "Uppdateras automatiskt när HomeBoard hämtar kalendern." : "Updates automatically when HomeBoard fetches the calendar.",
    chooseColor: language === "sv" ? "Välj färg" : "Choose color",
    chooseProvider: language === "sv" ? "Vilken kalender vill du lägga till?" : "Which calendar do you want to add?",
    connected: language === "sv" ? "Ansluten och aktiv" : "Connected and active",
    connectedCalendar: language === "sv" ? "Kalender" : "Calendar",
    customColor: language === "sv" ? "Annan färg" : "Custom",
    helperEyebrow: language === "sv" ? "Så funkar det" : "How it works",
    homeBoardAgenda: language === "sv" ? "HomeBoard-agenda" : "HomeBoard agenda",
    linkHelper: language === "sv" ? "Länken används bara för att hämta händelser till HomeBoard." : "This link is only used to fetch events into HomeBoard.",
    linkLabel: language === "sv" ? "Klistra in kalenderlänken" : "Paste calendar link",
    nameLabel: language === "sv" ? "Vad ska kalendern heta?" : "What should this calendar be called?",
    noSync: language === "sv" ? "Inte synkad ännu" : "Not synced yet",
    queued: language === "sv" ? "Väntar på sin tur" : "Waiting its turn",
    ready: language === "sv" ? "Redo" : "Ready",
    setupSubtitle: language === "sv" ? "Välj kalendern du använder. HomeBoard visar händelserna på väggen och i mobilen." : "Choose the calendar you use. HomeBoard will show events on the wall and mobile view.",
    syncedOk: language === "sv" ? "Kalendern fungerar" : "Calendar is working",
    working: language === "sv" ? "Hämtar kalendern…" : "Fetching calendar…",
    removeCalendar: language === "sv" ? "Ta bort kalender" : "Remove calendar",
    removeTitle: language === "sv" ? "Ta bort kalender?" : "Remove calendar?",
    removeBody: language === "sv" ? "Den här kalendern tas bort från HomeBoard. Händelser från kalendern visas inte längre." : "This calendar will be removed from HomeBoard. Events from this calendar will no longer be shown.",
    removeConfirm: language === "sv" ? "Ta bort" : "Remove",
    removeCancel: language === "sv" ? "Avbryt" : "Cancel",
    removeSuccess: language === "sv" ? "Kalendern togs bort." : "Calendar removed.",
    removeError: language === "sv" ? "Kunde inte ta bort kalendern." : "Could not remove calendar.",
  };
  const calendarMilestoneTitle = language === "sv" ? "Kalendern är kopplad till HomeBoard" : "Calendar is connected to HomeBoard";
  const calendarMilestoneBody = language === "sv" ? "Familjens dagar hämtas nu automatiskt och visas på väggen och i mobilen." : "Your family days now update automatically and show on the wall and mobile view.";
  const calendarMilestoneSteps = useMemo(() => language === "sv" ? ["Läser kalenderlänken…", "Hämtar familjens händelser…", "Bygger dagens agenda…", "Kalendern är aktiv"] : ["Reading calendar link…", "Fetching family events…", "Building today’s agenda…", "Calendar is active"], [language]);
  const calendarMilestoneStageCopy = calendarMilestoneSteps[calendarMilestoneStage] ?? calendarMilestoneTitle;
  const enabledSourcesCount = useMemo(() => sources.filter((source) => source.enabled).length, [sources]);
  const controlsDisabled = isSyncing || isWaterfallRunning || isCalendarMilestoneCelebrating;

  useEffect(() => {
    if (!isCalendarMilestoneCelebrating) return;

    setCalendarMilestoneStage(0);
    const stageTimers = CALENDAR_MILESTONE_STAGE_DELAYS_MS.map((delay, index) => window.setTimeout(() => setCalendarMilestoneStage(index + 1), delay));
    const celebrationTimer = window.setTimeout(() => setCalendarMilestoneCelebrating(false), CALENDAR_MILESTONE_DURATION_MS);
    return () => {
      stageTimers.forEach(window.clearTimeout);
      window.clearTimeout(celebrationTimer);
    };
  }, [isCalendarMilestoneCelebrating]);

  function markSourceSuccess(sourceId: string) {
    setSuccessSyncSourceIds((ids) => (ids.includes(sourceId) ? ids : [...ids, sourceId]));
    window.setTimeout(() => {
      setSuccessSyncSourceIds((ids) => ids.filter((id) => id !== sourceId));
    }, SYNC_SUCCESS_VISIBLE_MS);
  }

  async function submitCalendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveSyncSourceId("new");
    setCalendarMilestoneCelebrating(false);
    setCalendarMilestoneStage(0);
    const saved = await addSourceAndSync(name, url, color, true);
    setActiveSyncSourceId(null);
    if (!saved) return;
    setName("");
    setUrl("");
    setShowAdd(false);
    setCalendarMilestoneCelebrating(true);
  }

  async function handleSyncSource(sourceId: string) {
    setActiveSyncSourceId(sourceId);
    setQueuedSyncSourceIds([]);
    const synced = await syncSource(sourceId);
    await waitForMinimumSyncVisualDuration();
    setActiveSyncSourceId(null);
    if (synced) markSourceSuccess(sourceId);
  }

  async function handleSyncAll() {
    const enabledSourceIds = sources.filter((source) => source.enabled).map((source) => source.id);
    if (!enabledSourceIds.length) return;

    setWaterfallRunning(true);
    setSuccessSyncSourceIds([]);
    setQueuedSyncSourceIds(enabledSourceIds);
    try {
      for (const sourceId of enabledSourceIds) {
        setQueuedSyncSourceIds((ids) => ids.filter((id) => id !== sourceId));
        setActiveSyncSourceId(sourceId);
        const synced = await syncSource(sourceId);
        await waitForMinimumSyncVisualDuration();
        setActiveSyncSourceId(null);
        if (!synced) break;
        markSourceSuccess(sourceId);
        await wait(SYNC_SUCCESS_OVERLAP_MS);
      }
    } finally {
      setActiveSyncSourceId(null);
      setQueuedSyncSourceIds([]);
      setWaterfallRunning(false);
    }
  }


  async function handleRemoveSource(sourceId: string) {
    setRemovingSourceId(sourceId);
    setRemoveFeedback(null);
    try {
      await removeSource(sourceId);
      setPendingRemovalSourceId(null);
      setRemoveFeedback(text.removeSuccess);
    } catch (error) {
      console.warn("HomeBoard calendar source could not be removed.", error);
      setRemoveFeedback(text.removeError);
    } finally {
      setRemovingSourceId(null);
    }
  }
  function getSyncVisualPhase(sourceId: string): SyncVisualPhase {
    if (activeSyncSourceId === sourceId) return "syncing";
    if (successSyncSourceIds.includes(sourceId)) return "success";
    if (queuedSyncSourceIds.includes(sourceId)) return "queued";
    return "idle";
  }

  return (
    <SettingsCard status={setupState !== "ready" ? t("planned") : t("cloudReady")} title={t("calendarSources")}>
      <div className="space-y-4">
        {setupState === "ready" ? (
          <div className={`cloud-mode-card ${isCalendarMilestoneCelebrating ? `cloud-mode-card--celebrating cloud-mode-card--stage-${calendarMilestoneStage}` : "cloud-mode-card--local"}`}>
            <div className="cloud-mode-card__shine" />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{isCalendarMilestoneCelebrating ? t("calendarSources") : enabledSourcesCount ? text.connected : text.ready}</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-stone-950">{isCalendarMilestoneCelebrating ? calendarMilestoneStageCopy : enabledSourcesCount ? t("calendarAutoUpdating") : t("calendarEmptyState")}</h3>
              </div>
              <StatusChip tone={isCalendarMilestoneCelebrating && calendarMilestoneStage >= 3 ? "emerald" : enabledSourcesCount ? "emerald" : "amber"}>{isCalendarMilestoneCelebrating && calendarMilestoneStage >= 3 ? text.syncedOk : enabledSourcesCount ? text.connected : text.ready}</StatusChip>
            </div>
            <p className="relative mt-2 text-sm font-semibold leading-6 text-stone-700">{isCalendarMilestoneCelebrating ? calendarMilestoneBody : enabledSourcesCount ? `${enabledSourcesCount} ${text.activeSource}` : t("calendarProviderSoon")}</p>
            {isCalendarMilestoneCelebrating ? (
              <div className="cloud-milestone-stage" aria-live="polite">
                <div className="cloud-connection-path" aria-hidden="true">
                  <span>{text.connectedCalendar}</span>
                  <i />
                  <i />
                  <i />
                  <span>{text.homeBoardAgenda}</span>
                </div>
                <ol className="cloud-milestone-steps">
                  {calendarMilestoneSteps.map((step, index) => (
                    <li className={index <= calendarMilestoneStage ? "cloud-milestone-step cloud-milestone-step--active" : "cloud-milestone-step"} key={step}>
                      <span />
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}

        {setupState === "ready" && !sources.length ? <p className="text-sm font-semibold leading-6 text-stone-600">{t("calendarEmptyState")}</p> : null}
        <div className="flex flex-wrap gap-2">
          {setupState === "ready" ? <button className="pressable rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-900 shadow-sm disabled:opacity-60" disabled={controlsDisabled} onClick={() => setShowAdd((prev) => !prev)} type="button">{showAdd ? t("cancel") : t("calendarAdd")}</button> : null}
          {setupState === "ready" && sources.length > 1 ? <button className="pressable rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-900 shadow-sm disabled:opacity-60" disabled={controlsDisabled} onClick={handleSyncAll} type="button">{isWaterfallRunning ? t("calendarSyncing") : t("calendarSyncAll")}</button> : null}
        </div>
        {syncError ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{t(syncError)}</p> : null}
        {removeFeedback ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{removeFeedback}</p> : null}
        {sources.map((source: CalendarSource) => {
          const syncVisualPhase = getSyncVisualPhase(source.id);
          const sourceIsSyncing = syncVisualPhase === "syncing";
          const sourceIsQueued = syncVisualPhase === "queued";
          const sourceIsSuccess = syncVisualPhase === "success";
          const sourceIsHealthy = source.enabled && source.lastSyncedAt && !source.lastError;
          const statusLabel = sourceIsSyncing ? text.working : sourceIsQueued ? text.queued : sourceIsSuccess ? text.syncedOk : sourceIsHealthy ? text.syncedOk : text.noSync;
          return (
            <div className={`calendar-source-card calendar-source-card--${syncVisualPhase} ${sourceIsHealthy && syncVisualPhase === "idle" ? "calendar-source-card--healthy" : ""}`} key={source.id}>
              <div className="calendar-source-card__visual" aria-hidden="true" />
              <div className="calendar-source-card__center" aria-hidden="true">
                <span className={`calendar-source-card__spinner ${sourceIsSyncing ? "calendar-source-card__mark--visible" : ""}`} />
                <span className={`calendar-source-card__check ${sourceIsSuccess ? "calendar-source-card__mark--visible" : ""}`}>✓</span>
              </div>
              <div className={`relative transition-opacity duration-700 ease-[var(--ease-out)] ${sourceIsSyncing || sourceIsSuccess ? "opacity-60" : "opacity-100"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className={`h-4 w-4 rounded-full shadow-sm ring-2 ring-white ${sourceIsSyncing ? "animate-pulse" : ""}`} style={{ backgroundColor: source.color ?? "#f59e0b" }} />
                      <h3 className="truncate text-lg font-black text-stone-950">{source.name}</h3>
                    </div>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-stone-400">{statusLabel}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{t("calendarLastSynced")}: {formatLastSynced(source.lastSyncedAt, "—")}</p>
                    <p className="text-xs font-semibold leading-5 text-stone-500">{text.autoNote}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] ${source.enabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>{source.enabled ? t("calendarOn") : t("calendarOff")}</span>
                </div>
                {source.lastError ? <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{t("calendarCouldNotSync")} · {source.lastError}</p> : null}
                {source.syncUrl ? <p className="mt-3 truncate rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold text-stone-400">{maskUrl(source.syncUrl)}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="pressable rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-800 shadow-sm disabled:opacity-60" disabled={controlsDisabled} onClick={() => handleSyncSource(source.id)} type="button">{sourceIsSyncing ? t("calendarSyncing") : t("calendarSyncNow")}</button>
                  <button className="pressable rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-800 shadow-sm disabled:opacity-60" disabled={controlsDisabled} onClick={() => updateSourceEnabled(source.id, !source.enabled)} type="button">{source.enabled ? t("calendarDisable") : t("calendarEnable")}</button>
                  <button className="pressable rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 shadow-sm disabled:opacity-60" disabled={controlsDisabled || isRemovingSourceId === source.id} onClick={() => setPendingRemovalSourceId(source.id)} type="button">{text.removeCalendar}</button>
                </div>
              </div>
                {pendingRemovalSourceId === source.id ? (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                    <p className="text-sm font-black text-rose-900">{text.removeTitle}</p>
                    <p className="mt-1 text-xs font-semibold text-rose-800">{text.removeBody}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="pressable rounded-xl bg-rose-700 px-3 py-2 text-xs font-black text-white disabled:opacity-60" disabled={isRemovingSourceId === source.id} onClick={() => handleRemoveSource(source.id)} type="button">{isRemovingSourceId === source.id ? t("calendarSyncing") : text.removeConfirm}</button>
                      <button className="pressable rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-800" disabled={isRemovingSourceId === source.id} onClick={() => setPendingRemovalSourceId(null)} type="button">{text.removeCancel}</button>
                    </div>
                  </div>
                ) : null}
            </div>
          );
        })}
        {setupState === "ready" && showAdd ? (
          <div className={`rounded-[2rem] border border-stone-200/80 bg-white/90 p-4 shadow-sm shadow-stone-950/5 transition-[box-shadow,transform,border-color] duration-500 ease-[var(--ease-out)] ${activeSyncSourceId === "new" ? "scale-[1.01] border-amber-200 shadow-amber-200/80" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black tracking-tight text-stone-950">{t("calendarAdd")}</h3>
                <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-stone-600">{text.setupSubtitle}</p>
              </div>
              <StatusChip tone="amber">{text.ready}</StatusChip>
            </div>
            <form className="mt-5 space-y-5" onSubmit={submitCalendar}>
              <section>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-400">{text.chooseProvider}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {PROVIDER_CHOICES.map((option) => {
                    const selected = provider === option.choice;
                    return (
                      <button className={`pressable group min-h-24 rounded-[1.35rem] border px-4 py-3 text-left shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-out)] ${selected ? "scale-[1.01] border-stone-950 bg-stone-950 text-white shadow-xl shadow-stone-950/15" : "border-stone-200 bg-stone-50/70 text-stone-950 hover:border-amber-200 hover:bg-amber-50/50"}`} key={option.choice} onClick={() => setProvider(option.choice)} type="button" aria-pressed={selected}>
                        <span className="flex items-start justify-between gap-3">
                          <span className="flex size-9 items-center justify-center rounded-2xl bg-white/85 text-sm font-black text-stone-900 shadow-sm">{option.icon}</span>
                          <span className={`flex size-7 items-center justify-center rounded-full text-xs font-black transition ${selected ? "bg-emerald-400 text-emerald-950 opacity-100" : "bg-white text-stone-300 opacity-70"}`}>✓</span>
                        </span>
                        <span className="mt-3 block text-sm font-black">{t(option.labelKey)}</span>
                        <span className={`mt-1 block text-xs font-bold leading-5 ${selected ? "text-white/70" : "text-stone-500"}`}>{option.description[language]}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-amber-200/80 bg-amber-50/80 px-4 py-3 shadow-sm transition-[opacity,transform] duration-300 ease-[var(--ease-out)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-amber-700">{text.helperEyebrow}</p>
                <p className="mt-1 text-sm font-bold leading-6 text-amber-950">{providerHelpByChoice[provider]}</p>
              </section>

              <section className="grid gap-3">
                <label className="block">
                  <span className="text-sm font-black text-stone-800">{text.nameLabel}</span>
                  <input className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] placeholder:text-stone-400 focus:border-amber-400" onChange={(event) => setName(event.target.value)} placeholder={language === "sv" ? "Familjekalender" : "Family calendar"} value={name} />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-stone-800">{text.linkLabel}</span>
                  <input className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] placeholder:text-stone-400 focus:border-amber-400" onChange={(event) => setUrl(event.target.value)} placeholder="webcal://…" value={url} />
                  <span className="mt-2 block text-xs font-semibold leading-5 text-stone-500">{text.linkHelper}</span>
                </label>
              </section>

              <section>
                <p className="text-sm font-black text-stone-800">{text.chooseColor}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const selected = color.toLowerCase() === preset.value;
                    return (
                      <button className={`pressable flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition ${selected ? "border-stone-950 bg-white text-stone-950 ring-2 ring-amber-200" : "border-stone-200 bg-stone-50 text-stone-600"}`} key={preset.value} onClick={() => setColor(preset.value)} type="button">
                        <span className="flex size-7 items-center justify-center rounded-full text-[0.68rem] text-white shadow-sm ring-2 ring-white" style={{ backgroundColor: preset.value }}>{selected ? "✓" : ""}</span>
                        {preset.label[language]}
                      </button>
                    );
                  })}
                  <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-black text-stone-600 shadow-sm">
                    <span>{text.customColor}</span>
                    <input className="size-7 cursor-pointer rounded-xl border-0 bg-transparent" onChange={(event) => setColor(event.target.value)} type="color" value={color} />
                  </label>
                </div>
              </section>

              {syncError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-800">{t(syncError)}</p> : null}
              <button className="pressable min-h-12 rounded-2xl bg-stone-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoading || isSyncing || isWaterfallRunning || !name.trim() || !url.trim()} type="submit">{activeSyncSourceId === "new" ? t("calendarSyncing") : t("calendarSaveAndSync")}</button>
            </form>
          </div>
        ) : null}
      </div>
    </SettingsCard>
  );
}
