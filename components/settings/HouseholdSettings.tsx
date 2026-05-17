"use client";

import { resetSelectedHouseholdId } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useLanguage } from "@/lib/i18n";
import { SettingsCard } from "@/components/settings/SettingsCard";

export function HouseholdSettings() {
  const { household, householdId, isDevOverride, isLoading, refreshHouseholdId } = useActiveHousehold();
  const { t } = useLanguage();

  function resetHousehold() {
    resetSelectedHouseholdId();
    refreshHouseholdId();
  }

  const selectedHouseholdName = isLoading ? t("loading") : household?.name ?? t("notSelected");
  const selectionSource = isDevOverride ? t("developmentEnvOverride") : householdId ? t("thisDevice") : t("none");

  return (
    <SettingsCard status={householdId ? t("supabaseReady") : t("localPreview")} title={t("household")}>
      <div className="space-y-4">
        <p>{t("householdCopy")}</p>
        <dl className="grid gap-2 rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("activeHousehold")}</dt>
            <dd className="text-right font-black text-stone-900">{selectedHouseholdName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("householdId")}</dt>
            <dd className="max-w-[12rem] truncate text-right font-mono text-xs font-black text-stone-900" title={householdId ?? undefined}>
              {householdId ?? t("none")}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("selectionSource")}</dt>
            <dd className="text-right font-black text-stone-900">{selectionSource}</dd>
          </div>
        </dl>
        <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-60" disabled={isDevOverride} onClick={resetHousehold} type="button">
          {t("resetSelectedHousehold")}
        </button>
        {isDevOverride ? <p className="text-xs font-bold text-stone-500">{t("householdOverrideActiveCopy")}</p> : null}
      </div>
    </SettingsCard>
  );
}
