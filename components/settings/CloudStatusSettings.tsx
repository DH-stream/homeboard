"use client";

import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { useCloudDiagnostics } from "@/lib/hooks/useCloudDiagnostics";
import { getLocale, useLanguage } from "@/lib/i18n";
import type { CloudDiagnosticsStatus } from "@/lib/repositories/cloudDiagnosticsRepository";

function maskId(id: string | null) {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function CloudStatusSettings() {
  const { diagnostics, isLoading, refresh } = useCloudDiagnostics();
  const { language, t } = useLanguage();

  const status = diagnostics?.status ?? "not_configured";
  const tone = status === "active" ? "emerald" : status === "unreachable" ? "rose" : "amber";
  const statusLabels: Record<CloudDiagnosticsStatus, string> = {
    active: t("cloudSyncActive"),
    not_configured: t("cloudSyncNotConfigured"),
    unreachable: t("cloudSyncUnreachable"),
  };
  const checkedAt = diagnostics?.checkedAt ? new Intl.DateTimeFormat(getLocale(language), { dateStyle: "short", timeStyle: "short" }).format(new Date(diagnostics.checkedAt)) : "—";

  return (
    <SettingsCard status={status === "active" ? t("cloudConnected") : t("onlyOnThisDevice")} title={t("cloudStatus")}> 
      <div className="space-y-4">
        <p>{t("cloudStatusCopy")}</p>
        <dl className="grid gap-2 rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("cloudSync")}</dt>
            <dd className="text-right font-black text-stone-900">
              <StatusChip tone={tone}>{isLoading ? t("loading") : statusLabels[status]}</StatusChip>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("home")}</dt>
            <dd className="text-right font-black text-stone-900">{diagnostics?.householdName ?? t("notSelected")}</dd>
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
        {status === "unreachable" ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-950">{t("cloudUnavailableBody")}</p> : null}
        <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-800 shadow-sm" disabled={isLoading} onClick={refresh} type="button">
          {t("refreshCloudStatus")}
        </button>
        <details className="rounded-2xl border border-stone-200/80 bg-white/75 p-4 text-sm">
          <summary className="cursor-pointer font-black text-stone-800">{t("technicalInfo")}</summary>
          <dl className="mt-3 grid gap-2">
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-stone-500">{t("projectConfigured")}</dt>
              <dd className="text-right font-black text-stone-900">{diagnostics?.isProjectConfigured ? t("yes") : t("no")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-stone-500">{t("householdIdMasked")}</dt>
              <dd className="text-right font-mono text-xs font-black text-stone-900">{maskId(diagnostics?.householdId ?? null)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-stone-500">{t("repositoryMode")}</dt>
              <dd className="text-right font-black text-stone-900">{diagnostics?.repositoryMode === "cloud" ? t("cloud") : t("local")}</dd>
            </div>
          </dl>
        </details>
      </div>
    </SettingsCard>
  );
}
