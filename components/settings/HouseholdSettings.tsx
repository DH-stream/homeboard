"use client";

import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { enableLocalOnlyMode, forgetSelectedCloudHouseholdOnThisDevice } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useCloudDiagnostics } from "@/lib/hooks/useCloudDiagnostics";
import { useLanguage, type Language } from "@/lib/i18n";

const copy: Record<Language, { active: string; local: string; forget: string; status: string }> = {
  en: { active: "Cloud sync active", local: "Only on this device", forget: "Forget cloud home on this device", status: "Status" },
  sv: { active: "Molnsynk aktiv", local: "Endast på den här enheten", forget: "Glöm molnhem på den här enheten", status: "Status" },
};

export function HouseholdSettings() {
  const { household, householdId, refreshHouseholdId, selectedHouseholdId } = useActiveHousehold();
  const { diagnostics } = useCloudDiagnostics();
  const { language, t } = useLanguage();
  const labels = copy[language];

  const hasCloudHousehold = Boolean(householdId);

  function forgetOnDevice() {
    forgetSelectedCloudHouseholdOnThisDevice();
    enableLocalOnlyMode();
    refreshHouseholdId();
  }

  return (
    <SettingsCard status={hasCloudHousehold ? t("cloudConnected") : t("onlyOnThisDevice")} title={t("household")}>
      <div className="space-y-4">
        <dl className="grid gap-2 rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("home")}</dt>
            <dd className="text-right font-black text-stone-900">{household?.name ?? t("notSelected")}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{labels.status}</dt>
            <dd className="text-right"><StatusChip tone={hasCloudHousehold ? "emerald" : "amber"}>{hasCloudHousehold ? labels.active : labels.local}</StatusChip></dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("members")}</dt>
            <dd className="text-right font-black text-stone-900">{diagnostics?.memberCount ?? "—"}</dd>
          </div>
        </dl>

        {selectedHouseholdId ? (
          <button className="pressable min-h-11 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-950 shadow-sm" onClick={forgetOnDevice} type="button">
            {labels.forget}
          </button>
        ) : null}
      </div>
    </SettingsCard>
  );
}
