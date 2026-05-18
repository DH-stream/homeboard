"use client";

import { useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { useCalendarSettings } from "@/lib/hooks/useCalendarSettings";
import { useLanguage } from "@/lib/i18n";
import type { CalendarSource } from "@/types";

const maskUrl = (url?: string) => (url ? `${url.slice(0, 24)}••••` : "");
type ProviderChoice = "apple" | "google" | "microsoft" | "link";

export function CalendarSourcesSettings() {
  const { t } = useLanguage();
  const { sources, setupState, isLoading, isSyncing, syncError, addSourceAndSync, updateSourceEnabled, syncSource, syncAll } = useCalendarSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState<ProviderChoice>("apple");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#f59e0b");

  const providerHelpByChoice = {
    apple: t("calendarProviderAppleHelp"),
    google: t("calendarProviderGoogleHelp"),
    microsoft: t("calendarProviderMicrosoftHelp"),
    link: t("calendarLinkTitle"),
  } as const;

  async function submitCalendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await addSourceAndSync(name, url, color, true);
    if (!saved) return;
    setName("");
    setUrl("");
    setShowAdd(false);
  }

  return (
    <SettingsCard status={setupState !== "ready" ? t("planned") : t("cloudReady")} title={t("calendarSources")}>
      <div className="space-y-4">
        {setupState === "ready" && !sources.length ? <p className="text-sm font-semibold leading-6 text-stone-600">{t("calendarEmptyState")}</p> : null}
        <div className="flex flex-wrap gap-2">
          {setupState === "ready" ? <button className="pressable rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-900 shadow-sm" disabled={isSyncing} onClick={() => setShowAdd((prev) => !prev)} type="button">{showAdd ? t("cancel") : t("calendarAdd")}</button> : null}
          {setupState === "ready" && sources.length > 1 ? <button className="pressable rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-900 shadow-sm" disabled={isSyncing} onClick={() => syncAll()} type="button">{isSyncing ? t("calendarSyncing") : t("calendarSyncAll")}</button> : null}
        </div>
        {syncError ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{t(syncError)}</p> : null}
        {sources.map((source: CalendarSource) => (
          <div className="rounded-[1.5rem] border border-stone-200/80 bg-white/80 p-4 shadow-sm" key={source.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-3 w-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: source.color ?? "#f59e0b" }} />
                  <h3 className="truncate text-base font-black text-stone-950">{source.name}</h3>
                </div>
                <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{t("calendarConnected")} · {t("calendarLastSynced")}: {source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString() : "—"}</p>
                <p className="text-xs font-semibold leading-5 text-stone-500">{t("calendarAutoUpdating")}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] ${source.enabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>{source.enabled ? t("calendarOn") : t("calendarOff")}</span>
            </div>
            {source.lastError ? <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{t("calendarCouldNotSync")} · {source.lastError}</p> : null}
            {source.syncUrl ? <p className="mt-3 truncate rounded-2xl bg-stone-50 px-3 py-2 text-xs font-bold text-stone-400">{maskUrl(source.syncUrl)}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="pressable rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-800 shadow-sm" disabled={isSyncing} onClick={() => syncSource(source.id)} type="button">{isSyncing ? t("calendarSyncing") : t("calendarSyncNow")}</button>
              <button className="pressable rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-800 shadow-sm" disabled={isSyncing} onClick={() => updateSourceEnabled(source.id, !source.enabled)} type="button">{source.enabled ? t("calendarDisable") : t("calendarEnable")}</button>
            </div>
          </div>
        ))}
        {setupState === "ready" && showAdd ? (
          <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 p-4 shadow-sm">
            <div className="mb-3 h-1.5 w-12 rounded-full bg-amber-300" />
            <h3 className="text-xl font-black tracking-tight text-stone-950">{t("calendarAdd")}</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-stone-600">{t("calendarChooseProvider")}</p>
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
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black text-stone-700"><span>{t("calendarColor")}</span><input className="h-9 w-14 cursor-pointer rounded-xl border-0 bg-transparent" onChange={(event) => setColor(event.target.value)} type="color" value={color} /></label>
              <button className="pressable min-h-12 rounded-2xl bg-stone-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoading || isSyncing || !name.trim() || !url.trim()} type="submit">{isSyncing ? t("calendarSyncing") : t("calendarSaveAndSync")}</button>
            </form>
          </div>
        ) : null}
      </div>
    </SettingsCard>
  );
}