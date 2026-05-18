"use client";

import { useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { useCalendarSettings } from "@/lib/hooks/useCalendarSettings";
import { useLanguage } from "@/lib/i18n";
import type { CalendarSource } from "@/types";

const maskUrl = (url?: string) => (url ? `${url.slice(0, 18)}••••` : "");
type ProviderChoice = "apple" | "google" | "microsoft" | "link";

export function CalendarSourcesSettings() {
  const { t } = useLanguage();
  const { sources, setupState, isLoading, addIcsSource, updateSourceEnabled, syncSource, syncAll } = useCalendarSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState<ProviderChoice>("link");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#f59e0b");

  const showLinkForm = provider === "link";

  return <SettingsCard status={setupState !== "ready" ? t("planned") : t("cloudReady")} title={t("calendarSources")}>
    <div className="space-y-3">
      {setupState === "ready" && !sources.length ? <p>{t("calendarEmptyState")}</p> : null}
      {setupState === "ready" ? <button className="rounded-xl border px-3 py-2" onClick={() => setShowAdd((prev) => !prev)} type="button">{t("calendarAdd")}</button> : null}
      {setupState === "ready" && sources.length > 1 ? <button className="rounded-xl border px-3 py-2" onClick={() => syncAll()} type="button">{t("calendarSyncAll")}</button> : null}

      {sources.map((source: CalendarSource) => <div className="rounded-2xl border p-3" key={source.id}>
        <div className="flex items-center justify-between gap-2"><div className="font-bold">{source.name}</div><span className="text-xs">{source.enabled ? t("calendarOn") : t("calendarOff")}</span></div>
        <div className="text-xs text-stone-500">{t("calendarConnected")} · {t("calendarLastSynced")}: {source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString() : "—"}</div>
        <div className="text-xs text-stone-500">{t("calendarAutoUpdating")}</div>
        {source.lastError ? <div className="text-xs text-amber-700">{t("calendarCouldNotSync")} · {source.lastError}</div> : null}
        <div className="text-xs text-stone-400">{maskUrl(source.syncUrl)}</div>
        <div className="mt-2 flex gap-2"><button className="rounded-lg border px-2 py-1 text-xs" onClick={() => syncSource(source.id)} type="button">{t("calendarSyncNow")}</button><button className="rounded-lg border px-2 py-1 text-xs" onClick={() => updateSourceEnabled(source.id, !source.enabled)} type="button">{source.enabled ? t("calendarDisable") : t("calendarEnable")}</button></div>
      </div>)}

      {setupState === "ready" && showAdd ? <div className="rounded-2xl border p-3">
        <div className="font-bold">{t("calendarAdd")}</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="rounded-lg border px-2 py-1 text-left text-sm" onClick={() => setProvider("apple")} type="button">{t("calendarProviderApple")}</button>
          <button className="rounded-lg border px-2 py-1 text-left text-sm" onClick={() => setProvider("google")} type="button">{t("calendarProviderGoogle")}</button>
          <button className="rounded-lg border px-2 py-1 text-left text-sm" onClick={() => setProvider("microsoft")} type="button">{t("calendarProviderMicrosoft")}</button>
          <button className="rounded-lg border px-2 py-1 text-left text-sm" onClick={() => setProvider("link")} type="button">{t("calendarProviderLink")}</button>
        </div>
        {showLinkForm ? <form className="mt-3" onSubmit={async (event) => { event.preventDefault(); await addIcsSource(name, url, color, true); setName(""); setUrl(""); setShowAdd(false); }}>
          <div className="text-xs text-stone-600">{t("calendarLinkTitle")}</div>
          <input className="mt-2 w-full rounded border px-2 py-1" onChange={(e) => setName(e.target.value)} placeholder={t("calendarSourceName")} value={name} />
          <input className="mt-2 w-full rounded border px-2 py-1" onChange={(e) => setUrl(e.target.value)} placeholder={t("calendarLinkUrl")} value={url} />
          <div className="mt-2"><input onChange={(e) => setColor(e.target.value)} type="color" value={color} /></div>
          <button className="mt-2 rounded-xl border px-3 py-1" disabled={isLoading || !name || !url} type="submit">{t("calendarSave")}</button>
        </form> : <p className="mt-3 text-xs text-stone-600">{t("calendarProviderSoon")}</p>}
      </div> : null}
    </div>
  </SettingsCard>;
}
