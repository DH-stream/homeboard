"use client";

import { resetSelectedHouseholdId } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useLanguage, type Language } from "@/lib/i18n";
import { SettingsCard } from "@/components/settings/SettingsCard";

const settingsCopy: Record<
  Language,
  {
    activeHousehold: string;
    developmentOverride: string;
    householdId: string;
    overrideActiveCopy: string;
    loading: string;
    none: string;
    notSelected: string;
    resetSelectedHousehold: string;
    selectionSource: string;
    thisDevice: string;
  }
> = {
  en: {
    activeHousehold: "Active household",
    developmentOverride: "Development override",
    householdId: "Household id",
    overrideActiveCopy: "A development override is active, so local selection resets will not change the current household.",
    loading: "Loading…",
    none: "None",
    notSelected: "Not selected",
    resetSelectedHousehold: "Reset selected household on this device",
    selectionSource: "Selection source",
    thisDevice: "This device",
  },
  sv: {
    activeHousehold: "Aktivt hushåll",
    developmentOverride: "Utvecklingsoverride",
    householdId: "Hushålls-id",
    overrideActiveCopy: "En utvecklingsoverride är aktiv, så återställning på enheten ändrar inte aktuellt hushåll.",
    loading: "Laddar…",
    none: "Ingen",
    notSelected: "Inte valt",
    resetSelectedHousehold: "Återställ valt hushåll på den här enheten",
    selectionSource: "Källa för valet",
    thisDevice: "Den här enheten",
  },
};

function maskId(id: string | null) {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function HouseholdSettings() {
  const { household, householdId, isDevOverride, isLoading, refreshHouseholdId } = useActiveHousehold();
  const { language, t } = useLanguage();
  const copy = settingsCopy[language];

  function resetHousehold() {
    resetSelectedHouseholdId();
    refreshHouseholdId();
  }

  const selectedHouseholdName = isLoading ? copy.loading : household?.name ?? copy.notSelected;
  const selectionSource = isDevOverride ? copy.developmentOverride : householdId ? copy.thisDevice : copy.none;

  return (
    <SettingsCard status={householdId ? t("cloudReady") : t("localPreview")} title={t("household")}>
      <div className="space-y-4">
        <p>{t("householdCopy")}</p>
        <dl className="grid gap-2 rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{copy.activeHousehold}</dt>
            <dd className="text-right font-black text-stone-900">{selectedHouseholdName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{copy.selectionSource}</dt>
            <dd className="text-right font-black text-stone-900">{selectionSource}</dd>
          </div>
        </dl>
        <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-60" disabled={isDevOverride} onClick={resetHousehold} type="button">
          {copy.resetSelectedHousehold}
        </button>
        {isDevOverride ? <p className="text-xs font-bold text-stone-500">{copy.overrideActiveCopy}</p> : null}
        <details className="rounded-2xl border border-stone-200/80 bg-white/75 p-4 text-sm">
          <summary className="cursor-pointer font-black text-stone-800">{t("technicalInfo")}</summary>
          <dl className="mt-3 grid gap-2">
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-stone-500">{copy.householdId}</dt>
              <dd className="text-right font-mono text-xs font-black text-stone-900" title={householdId ?? undefined}>
                {maskId(householdId)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-stone-500">{copy.selectionSource}</dt>
              <dd className="text-right font-black text-stone-900">{selectionSource}</dd>
            </div>
          </dl>
        </details>
      </div>
    </SettingsCard>
  );
}
