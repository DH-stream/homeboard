"use client";

import { useEffect, useMemo, useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { useCalendarSettings } from "@/lib/hooks/useCalendarSettings";
import { useLanguage } from "@/lib/i18n";
import type { CalendarSource } from "@/types";

const maskUrl = (url?: string) => (url ? `${url.slice(0, 24)}••••` : "");
type ProviderChoice = "apple" | "google" | "microsoft" | "link";
const CALENDAR_MILESTONE_DURATION_MS = 5600;
const CALENDAR_MILESTONE_STAGE_DELAYS_MS = [1250, 2600, 3950];

function formatLastSynced(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return new Date(value).toLocaleString();
}

export function CalendarSourcesSettings() {
  const { language, t } = useLanguage();
  const { sources, setupState, isLoading, isSyncing, syncError, addSourceAndSync, updateSourceEnabled, syncSource, syncAll } = useCalendarSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState<ProviderChoice>("apple");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#f59e0b");
  const [activeSyncSourceId, setActiveSyncSourceId] = useState<string | null>(null);
  const [isCalendarMilestoneCelebrating, setCalendarMilestoneCelebrating] = useState(false);
  const [calendarMilestoneStage, setCalendarMilestoneStage] = useState(0);

  const providerHelpByChoice = {
    apple: t("calendarProviderAppleHelp"),
    google: t("calendarProviderGoogleHelp"),
    microsoft: t("calendarProviderMicrosoftHelp"),
    link: t("calendarLinkTitle"),
  } as const;

  const chooseProviderLabel = language === "sv" ? "Välj kalender" : "Choose your calendar";
  const colorLabel = language === "sv" ? "Färg" : "Color";
  const workingLabel = language === "sv" ? "Hämtar kalendern…" : "Fetching calendar…";
  const readyLabel = language === "sv" ? "Redo" : "Ready";
  const connectedLabel = language === "sv" ? "Ansluten och aktiv" : "Connected and active";
  const noSyncLabel = language === "sv" ? "Inte synkad ännu" : "Not synced yet";
  const syncedOkLabel = language === "sv" ? "Kalendern fungerar" : "Calendar is working";
  const calendarMilestoneTitle = language === "sv" ? "Kalendern är kopplad till HomeBoard" : "Calendar is connected to HomeBoard";
  const calendarMilestoneBody = language === "sv" ? "Familjens dagar hämtas nu automatiskt och visas på väggen och i mobilen." : "Your family days now update automatically and show on the wall and mobile view.";
  const connectedCalendar = language === "sv" ? "Kalender" : "Calendar";
  const homeBoardAgenda = language === "sv" ? "HomeBoard-agenda" : "HomeBoard agenda";
  const calendarMilestoneSteps = useMemo(() => language === "sv" ? ["Läser kalenderlänken…", "Hämtar familjens händelser…", "Bygger dagens agenda…", "Kalendern är aktiv"] : ["Reading calendar link…", "Fetching family events…", "Building today’s agenda…", "Calendar is active"], [language]);
  const calendarMilestoneStageCopy = calendarMilestoneSteps[calendarMilestoneStage] ?? calendarMilestoneTitle;

  const enabledSourcesCount = useMemo(() => sources.filter((source) => source.enabled).length, [sources]);

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
    await syncSource(sourceId);
    setActiveSyncSourceId(null);
  }

  async function handleSyncAll() {
    setActiveSyncSourceId("all");
    await syncAll();
    setActiveSyncSourceId(null);
  }

  return (
    <SettingsCard status={setupState !== "ready" ? t("planned") : t("cloudReady")} title={t("calendarSources")}>
      <div className="space-y-4">
        {setupState === "ready" ? (
          <div className={`cloud-mode-card ${isCalendarMilestoneCelebrating ? `cloud-mode-card--celebrating cloud-mode-card--stage-${calendarMilestoneStage}` : "cloud-mode-card--local"}`}>
            <div className="cloud-mode-card__shine" />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{isCalendarMilestoneCelebrating ? t("calendarSources") : enabledSourcesCount ? connectedLabel : readyLabel}</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-stone-950">{isCalendarMilestoneCelebrating ? calendarMilestoneStageCopy : enabledSourcesCount ? t("calendarAutoUpdating") : t("calendarEmptyState")}</h3>
              </div>
              <StatusChip tone={isCalendarMilestoneCelebrating && calendarMilestoneStage >= 3 ? "emerald" : enabledSourcesCount ? "emerald" : "amber"}>{isCalendarMilestoneCelebrating && calendarMilestoneStage >= 3 ? syncedOkLabel : enabledSourcesCount ? connectedLabel : readyLabel}</StatusChip>
            </div>
            <p className="relative mt-2 text-sm font-semibold leading-6 text-stone-700">{isCalendarMilestoneCelebrating ? calendarMilestoneBody : enabledSourcesCount ? `${enabledSourcesCount} ${language === "sv" ? "aktiv kalenderkälla" : "active calendar source"}` : t("calendarProviderSoon")}</p>
            {isCalendarMilestoneCelebrating ? (
              <div className="cloud-milestone-stage" aria-live="polite">
                <div className="cloud-connection-path" aria-hidden="true">
                  <span>{connectedCalendar}</span>
                  <i />
                  <i />
                  <i />
                  <span>{homeBoardAgenda}</span>
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
          {setupState === "ready" ? <button className="pressable rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-900 shadow-sm" disabled={isSyncing || isCalendarMilestoneCelebrating} onClick={() => setShowAdd((prev) => !prev)} type="button">{showAdd ? t("cancel") : t("calendarAdd")}</button> : null}
          {setupState === "ready" && sources.length > 1 ? <button className="pressable rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-900 shadow-sm" disabled={isSyncing || isCalendarMilestoneCelebrating} onClick={handleSyncAll} type="button">{isSyncing && activeSyncSourceId === "all" ? t("calendarSyncing") : t("calendarSyncAll")}</button> : null}
        </div>
        {syncError ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{t(syncError)}</p> : null}
        {sources.map((source: CalendarSource) => {
          const sourceIsSyncing = isSyncing && activeSyncSourceId === source.id;
          const sourceIsHealthy = source.enabled && source.lastSyncedAt && !source.lastError;
          return (
            <div className={`relative overflow-hidden rounded-[1.75rem] border p-4 shadow-sm transition-[box-shadow,transform,border-color] duration-300 ${sourceIsSyncing ? "scale-[1.01] border-amber-200 bg-amber-50/80 shadow-amber-200/80" : sourceIsHealthy ? "border-emerald-100 bg-emerald-50/45 shadow-emerald-100/80" : "border-stone-200/80 bg-white/80"}`} key={source.id}>
              {sourceIsSyncing ? <div className="absolute inset-x-4 top-0 h-1 rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-emerald-300 animate-pulse" /> : null}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className={`h-4 w-4 rounded-full shadow-sm ring-2 ring-white ${sourceIsSyncing ? "animate-pulse" : ""}`} style={{ backgroundColor: source.color ?? "#f59e0b" }} />
                    <h3 className="truncate text-lg font-black text-stone-950">{source.name}</h3>
                  </div>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-stone-400">{sourceIsSyncing ? workingLabel : sourceIsHealthy ? syncedOkLabel : noSyncLabel}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{t("calendarLastSynced")}: {formatLastSynced(source.lastSyncedAt, "—")}</p>
                  <p className="text-xs font-semibold leading-5 text-stone-500">{t("calendarAutoUpdating")}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] ${source.enabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>{source.enabled ? t("calendarOn") : t("calendarOff")}</span>
              </div>
              {source.lastError ? <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{t("calendarCouldNotSync")} · {source.lastError}</p> : null}
              {source.syncUrl ? <p className="mt-3 truncate rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold text-stone-400">{maskUrl(source.syncUrl)}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="pressable rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-800 shadow-sm disabled:opacity-60" disabled={isSyncing || isCalendarMilestoneCelebrating} onClick={() => handleSyncSource(source.id)} type="button">{sourceIsSyncing ? t("calendarSyncing") : t("calendarSyncNow")}</button>
                <button className="pressable rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-800 shadow-sm disabled:opacity-60" disabled={isSyncing || isCalendarMilestoneCelebrating} onClick={() => updateSourceEnabled(source.id, !source.enabled)} type="button">{source.enabled ? t("calendarDisable") : t("calendarEnable")}</button>
              </div>
            </div>
          );
        })}
        {setupState === "ready" && showAdd ? (
          <div className={`rounded-[2rem] border border-stone-200/80 bg-white/85 p-4 shadow-sm transition-[box-shadow,transform] duration-300 ${activeSyncSourceId === "new" ? "scale-[1.01] shadow-amber-200/80" : ""}`}>
            <div className={`mb-3 h-1.5 w-12 rounded-full bg-amber-300 ${activeSyncSourceId === "new" ? "animate-pulse" : ""}`} />
            <h3 className="text-xl font-black tracking-tight text-stone-950">{t("calendarAdd")}</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-stone-600">{chooseProviderLabel}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["apple", "google", "microsoft", "link"] as ProviderChoice[]).map((choice) => {
                const selected = provider === choice;
                return <button className={`pressable min-h-16 rounded-2xl border px-3 py-3 text-left text-sm font-black shadow-sm transition ${selected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-950"}`} key={choice} onClick={() => setProvider(choice)} type="button">{t(choice === "apple" ? "calendarProviderApple" : choice === "google" ? "calendarProviderGoogle" : choice === "microsoft" ? "calendarProviderMicrosoft" : "calendarProviderLink")}</button>;
              })}
            </div>
            <form className="mt-4 space-y-3" onSubmit={submitCalendar}>
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">{providerHelpByChoice[provider]}</p>
              <input className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-950 outline-none focus:border-amber-400" onChange={(event) => setName(event.target.value)} placeholder={t("calendarSourceName")} value={name} />
              <input className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-950 outline-none focus:border-amber-400" onChange={(event) => setUrl(event.target.value)} placeholder={t("calendarLinkUrl")} value={url} />
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black text-stone-700"><span>{colorLabel}</span><input className="h-9 w-14 cursor-pointer rounded-xl border-0 bg-transparent" onChange={(event) => setColor(event.target.value)} type="color" value={color} /></label>
              <button className="pressable min-h-12 rounded-2xl bg-stone-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoading || isSyncing || !name.trim() || !url.trim()} type="submit">{activeSyncSourceId === "new" ? t("calendarSyncing") : t("calendarSaveAndSync")}</button>
            </form>
          </div>
        ) : null}
      </div>
    </SettingsCard>
  );
}