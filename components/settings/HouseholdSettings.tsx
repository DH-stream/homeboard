"use client";

import { useEffect, useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { signOutParentLocally } from "@/lib/auth/parentAuth";
import { getDeviceProfile } from "@/lib/devicePreferences";
import { enableLocalOnlyMode, forgetSelectedCloudHouseholdOnThisDevice } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { useCloudDiagnostics } from "@/lib/hooks/useCloudDiagnostics";
import { useLanguage, type Language } from "@/lib/i18n";

const copy: Record<Language, { active: string; local: string; forget: string; status: string; confirm: string; cancel: string; homeName: string; renameHome: string; saveName: string; renameSuccess: string; renameError: string }> = {
  en: { active: "Cloud sync active", local: "Only on this device", forget: "Forget cloud home on this device", status: "Status", confirm: "This only forgets the selected cloud home on this device. The home is not deleted in cloud sync, and tasks, members, and calendar data are not removed.", cancel: "Cancel", homeName: "Home name", renameHome: "Rename home", saveName: "Save name", renameSuccess: "Home name updated.", renameError: "Could not update home name." },
  sv: { active: "Molnsynk aktiv", local: "Endast på den här enheten", forget: "Glöm molnhem på den här enheten", status: "Status", confirm: "Detta glömmer bara valt molnhem på den här enheten. Hemmet raderas inte i molnsynk, och uppgifter, medlemmar och kalenderdata tas inte bort.", cancel: "Avbryt", homeName: "Hemnamn", renameHome: "Byt namn på hemmet", saveName: "Spara namn", renameSuccess: "Hemnamnet har uppdaterats.", renameError: "Kunde inte uppdatera hemnamnet." },
};

export function HouseholdSettings() {
  const { household, householdId, refresh, refreshHouseholdId, selectedHouseholdId } = useActiveHousehold();
  const { diagnostics } = useCloudDiagnostics();
  const { language, t } = useLanguage();
  const labels = copy[language];

  const hasCloudHousehold = Boolean(householdId);
  const [isConfirming, setConfirming] = useState(false);
  const [nextHomeName, setNextHomeName] = useState("");
  const [isSavingName, setSavingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<string | null>(null);

  useEffect(() => {
    setNextHomeName(household?.name ?? "");
  }, [household?.name]);



  async function saveHomeName() {
    if (!householdId) return;
    const trimmedName = nextHomeName.trim();
    if (!trimmedName) {
      setNameFeedback(labels.renameError);
      return;
    }

    setSavingName(true);
    setNameFeedback(null);
    try {
      await householdRepository.updateHouseholdName(householdId, trimmedName);
      setNameFeedback(labels.renameSuccess);
      await refresh();
    } catch (error) {
      console.warn("HomeBoard household name could not be updated.", error);
      setNameFeedback(labels.renameError);
    } finally {
      setSavingName(false);
    }
  }

  function forgetOnDevice() {
    if (getDeviceProfile() === "wall") void signOutParentLocally();
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


        <div className="rounded-2xl border border-stone-200/70 bg-stone-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-stone-500">{labels.homeName}</p>
          <p className="mt-1 text-base font-black text-stone-900">{labels.renameHome}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input className="min-h-11 flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900" maxLength={40} onChange={(event) => setNextHomeName(event.target.value)} value={nextHomeName} />
            <button className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-2 text-sm font-black text-white disabled:opacity-60" disabled={isSavingName || !nextHomeName.trim() || nextHomeName.trim() === (household?.name ?? "")} onClick={saveHomeName} type="button">{labels.saveName}</button>
          </div>
          {nameFeedback ? <p className="mt-2 text-sm font-semibold text-stone-700">{nameFeedback}</p> : null}
        </div>

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
