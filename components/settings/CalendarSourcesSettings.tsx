"use client";

import { useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { useCalendarSettings } from "@/lib/hooks/useCalendarSettings";
import { useLanguage } from "@/lib/i18n";

const maskUrl = (url?: string) => (url ? `${url.slice(0, 18)}••••` : "");

export function CalendarSourcesSettings() {
  const { t } = useLanguage();
  const { sources, setupState, isLoading, addIcsSource, updateSourceEnabled, syncSource, syncAll } = useCalendarSettings();
  const [name, setName] = useState(""); const [url, setUrl] = useState(""); const [color, setColor] = useState("#f59e0b"); const [enabled, setEnabled] = useState(true);

  return <SettingsCard status={setupState !== "ready" ? t("planned") : t("cloudReady")} title={t("calendarSources")}>
    <div className="space-y-3">
      {setupState === "ready" && sources.length > 1 ? <button className="rounded-xl border px-3 py-2" onClick={() => syncAll()} type="button">Synka alla / Sync all</button> : null}
      {setupState === "ready" && !sources.length ? <p>Lägg till en kalenderkälla för att visa familjens dagar på väggen.</p> : null}
      {sources.map((source: any) => <div className="rounded-2xl border p-3" key={source.id}>
        <div className="flex items-center justify-between gap-2"><div className="font-bold">{source.name}</div><span className="text-xs">{source.enabled ? "På/On" : "Av/Off"}</span></div>
        <div className="text-xs text-stone-500">Kalenderkälla · Senast synkad: {source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString() : "—"}</div>
        {source.lastError ? <div className="text-xs text-amber-700">Kunde inte synka kalendern · {source.lastError}</div> : null}
        <div className="text-xs text-stone-400">{maskUrl(source.syncUrl)}</div>
        <div className="mt-2 flex gap-2"><button className="rounded-lg border px-2 py-1 text-xs" onClick={() => syncSource(source.id)} type="button">Synka nu</button><button className="rounded-lg border px-2 py-1 text-xs" onClick={() => updateSourceEnabled(source.id, !source.enabled)} type="button">{source.enabled ? "Disable" : "Enable"}</button></div>
      </div>)}

      {setupState === "ready" ? <form className="rounded-2xl border p-3" onSubmit={async (e) => { e.preventDefault(); await addIcsSource(name, url, color, enabled); setName(""); setUrl(""); }}>
        <div className="font-bold">Ny kalenderkälla / New source</div>
        <input className="mt-2 w-full rounded border px-2 py-1" onChange={(e) => setName(e.target.value)} placeholder="Source name" value={name} />
        <input className="mt-2 w-full rounded border px-2 py-1" onChange={(e) => setUrl(e.target.value)} placeholder="ICS / webcal URL" value={url} />
        <div className="mt-2 flex items-center gap-2"><input onChange={(e) => setColor(e.target.value)} type="color" value={color} /><label><input checked={enabled} onChange={(e) => setEnabled(e.target.checked)} type="checkbox"/> Enabled</label></div>
        <button className="mt-2 rounded-xl border px-3 py-1" disabled={isLoading || !name || !url} type="submit">Save</button>
      </form> : null}
    </div>
  </SettingsCard>;
}
