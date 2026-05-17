"use client";

import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { useCalendarSettings } from "@/lib/hooks/useCalendarSettings";
import { useLanguage } from "@/lib/i18n";
import type { CalendarConnection, CalendarProvider, CalendarSource } from "@/types";

const providerLabels: Record<CalendarProvider, string> = {
  google: "Google",
  microsoft: "Microsoft",
  icloud_caldav: "iCloud",
  ics: "ICS",
  manual: "Manual",
};

function groupSources(connections: CalendarConnection[], sources: CalendarSource[]) {
  return connections.map((connection) => ({
    connection,
    sources: sources.filter((source) => source.connectionId === connection.id),
  }));
}

export function CalendarSourcesSettings() {
  const { t } = useLanguage();
  const { connections, sources, isLoading, updateSourceEnabled } = useCalendarSettings();
  const groupedSources = groupSources(connections, sources);

  return (
    <SettingsCard status={t("localPreview")} title={t("calendarSources")}>
      <div className="space-y-4">
        <p>{t("calendarSourcesCopy")}</p>
        <p className="rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
          {t("calendarSourcesStorageCopy")}
        </p>
        <div className="space-y-3">
          {groupedSources.map(({ connection, sources: connectionSources }) => (
            <section className="rounded-[1.5rem] border border-stone-200/80 bg-white/78 p-3 shadow-sm" key={connection.id}>
              <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-stone-950">{connection.accountLabel}</h3>
                  <p className="truncate text-xs font-bold text-stone-500">
                    {providerLabels[connection.provider]}{connection.accountEmail ? ` · ${connection.accountEmail}` : ""}
                  </p>
                </div>
                <StatusChip tone="emerald">{providerLabels[connection.provider]}</StatusChip>
              </div>

              <div className="space-y-2">
                {connectionSources.map((source) => (
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/80 px-3 py-2 transition-[background-color,box-shadow,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.99]" key={source.id}>
                    <input
                      checked={source.enabled}
                      className="peer sr-only"
                      disabled={isLoading}
                      onChange={(event) => updateSourceEnabled(source.id, event.target.checked)}
                      type="checkbox"
                    />
                    <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: source.color ?? "#f59e0b" }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-stone-900">{source.name}</span>
                      <span className="block truncate text-xs font-bold uppercase tracking-[0.12em] text-stone-400">{t("readOnly")}</span>
                    </span>
                    <span className={`relative h-8 w-14 shrink-0 rounded-full p-1 shadow-inner transition-colors duration-150 ease-[var(--ease-out)] peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-500 ${source.enabled ? "bg-emerald-500" : "bg-stone-300"}`}>
                      <span className={`block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-150 ease-[var(--ease-out)] ${source.enabled ? "translate-x-6" : "translate-x-0"}`} />
                    </span>
                    <span className="w-10 shrink-0 text-right text-xs font-black text-stone-500">{source.enabled ? t("on") : t("off")}</span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}
