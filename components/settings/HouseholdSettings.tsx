"use client";

import { useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { enableLocalOnlyMode, forgetSelectedCloudHouseholdOnThisDevice } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useCloudDiagnostics } from "@/lib/hooks/useCloudDiagnostics";
import { useLanguage, type Language } from "@/lib/i18n";

const copy: Record<Language, { active: string; local: string; forget: string; status: string; confirm: string; cancel: string }> = {
  en: { active: "Cloud sync active", local: "Only on this device", forget: "Forget cloud home on this device", status: "Status", confirm: "This only forgets the selected cloud home on this device. The home is not deleted in cloud sync, and tasks, members, and calendar data are not removed.", cancel: "Cancel" },
  sv: { active: "Molnsynk aktiv", local: "Endast på den här enheten", forget: "Glöm molnhem på den här enheten", status: "Status", confirm: "Detta glömmer bara valt molnhem på den här enheten. Hemmet raderas inte i molnsynk, och uppgifter, medlemmar och kalenderdata tas inte bort.", cancel: "Avbryt" },
};

export function HouseholdSettings() {
  const { household, householdId, refreshHouseholdId, selectedHouseholdId } = useActiveHousehold();
  const { diagnostics } = useCloudDiagnostics();
  const { language, t } = useLanguage();
  const labels = copy[language];

  const hasCloudHousehold = Boolean(householdId);
  const [isConfirming, setConfirming] = useState(false);

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
          isConfirming ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-950">{labels.confirm}</p>
              <div className="mt-3 flex gap-2">
                <button className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white" onClick={forgetOnDevice} type="button">{labels.forget}</button>
                <button className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-800" onClick={() => setConfirming(false)} type="button">{labels.cancel}</button>
              </div>
            </div>
          ) : (
            <button className="pressable min-h-11 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-950 shadow-sm" onClick={() => setConfirming(true)} type="button">
              {labels.forget}
            </button>
          )
        ) : null}
      </div>
    </SettingsCard>
  );
}
