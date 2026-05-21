"use client";

import { useEffect, useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { signOutParentLocally } from "@/lib/auth/parentAuth";
import { getDeviceProfile } from "@/lib/devicePreferences";
import { enableLocalOnlyMode, forgetSelectedCloudHouseholdOnThisDevice } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useCloudDiagnostics } from "@/lib/hooks/useCloudDiagnostics";
import { useLanguage, type Language } from "@/lib/i18n";
import { householdRepository } from "@/lib/repositories/householdRepository";

const copy: Record<Language, Record<string, string>> = {
  en: {
    active: "Cloud sync active",
    local: "Only on this device",
    homeName: "Home name",
    edit: "Edit",
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    renameError: "Could not update home name.",
    cloudSync: "Cloud sync",
    checkAgain: "Check again",
    deviceArea: "This device",
    notifications: "Notifications",
    notificationsSoon: "Coming soon",
    enableNotifications: "Enable notifications",
    forget: "Forget cloud home on this device",
    confirm: "This only forgets the selected cloud home on this device. The home is not deleted in cloud sync.",
    members: "Members",
  },
  sv: {
    active: "Molnsynk aktiv",
    local: "Endast på den här enheten",
    homeName: "Hemnamn",
    edit: "Ändra",
    save: "Spara",
    saved: "Sparat",
    cancel: "Avbryt",
    renameError: "Kunde inte uppdatera hemnamnet.",
    cloudSync: "Molnsynk",
    checkAgain: "Kontrollera igen",
    deviceArea: "Den här enheten",
    notifications: "Notiser",
    notificationsSoon: "Kommer snart",
    enableNotifications: "Aktivera notiser",
    forget: "Glöm molnhem på den här enheten",
    confirm: "Detta glömmer bara valt molnhem på den här enheten. Hemmet raderas inte i molnsynk.",
    members: "Medlemmar",
  },
};

export function HouseholdSettings() {
  const { household, householdId, refresh, refreshHouseholdId, selectedHouseholdId } = useActiveHousehold();
  const { diagnostics, refresh: refreshCloudDiagnostics } = useCloudDiagnostics();
  const { language } = useLanguage();
  const labels = copy[language];
  const hasCloudHousehold = Boolean(householdId);

  const [isEditingName, setEditingName] = useState(false);
  const [homeNameDraft, setHomeNameDraft] = useState("");
  const [isSavingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [isCloudOpen, setCloudOpen] = useState(false);
  const [isConfirming, setConfirming] = useState(false);

  useEffect(() => setHomeNameDraft(household?.name ?? ""), [household?.name]);

  async function saveHomeName() {
    if (!householdId) return;
    const trimmed = homeNameDraft.trim();
    if (!trimmed || trimmed === (household?.name ?? "")) return;
    setSavingName(true);
    setNameError(null);
    try {
      await householdRepository.updateHouseholdName(householdId, trimmed);
      await refresh();
      setSaveState("saved");
      window.setTimeout(() => {
        setSaveState("idle");
        setEditingName(false);
      }, 1150);
    } catch (error) {
      console.warn("HomeBoard household name could not be updated.", error);
      setNameError(labels.renameError);
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

  const unchanged = homeNameDraft.trim() === (household?.name ?? "") || !homeNameDraft.trim() || isSavingName;

  return (
    <SettingsCard status={hasCloudHousehold ? labels.active : labels.local} title={language === "sv" ? "Hem" : "Home"}>
      <div className="space-y-3">
        <dl className="space-y-2 rounded-2xl border border-stone-200/70 bg-stone-50/90 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-bold text-stone-500">{labels.homeName}</dt>
            {!isEditingName ? (
              <dd className="flex items-center gap-2">
                <span className="font-black text-stone-900">{household?.name ?? "—"}</span>
                <button className="pressable min-h-8 rounded-xl border border-stone-200 bg-white px-2.5 text-xs font-black text-stone-700" onClick={() => setEditingName(true)} type="button">{labels.edit}</button>
              </dd>
            ) : (
              <dd className="flex w-full max-w-sm items-center gap-2">
                <input className="min-h-9 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-900" maxLength={40} onChange={(event) => setHomeNameDraft(event.target.value)} value={homeNameDraft} />
                <button className={`pressable min-h-9 rounded-xl px-3 text-xs font-black text-white transition-all duration-250 ${saveState === "saved" ? "bg-emerald-600" : "bg-stone-950"} disabled:opacity-40`} disabled={unchanged} onClick={saveHomeName} type="button">
                  <span className="transition-opacity duration-200">{saveState === "saved" ? labels.saved : labels.save}</span>
                </button>
                <button className="pressable min-h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700" onClick={() => { setEditingName(false); setNameError(null); setHomeNameDraft(household?.name ?? ""); }} type="button">{labels.cancel}</button>
              </dd>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-bold text-stone-500">{labels.members}</dt><dd className="font-black text-stone-900">{diagnostics?.memberCount ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-bold text-stone-500">{labels.cloudSync}</dt>
            <dd>
              <button className="pressable inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-black text-stone-700" onClick={() => setCloudOpen((prev) => !prev)} type="button">
                <StatusChip tone={hasCloudHousehold ? "emerald" : "amber"}>{hasCloudHousehold ? labels.active : labels.local}</StatusChip>
              </button>
            </dd>
          </div>
        </dl>
        {nameError ? <p className="px-1 text-xs font-semibold text-rose-700">{nameError}</p> : null}

        {isCloudOpen ? (
          <div className="rounded-2xl border border-stone-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-stone-700">
            <p>{hasCloudHousehold ? labels.active : labels.local}</p>
            <button className="pressable mt-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-black text-stone-700" onClick={() => void refreshCloudDiagnostics()} type="button">{labels.checkAgain}</button>
          </div>
        ) : null}

        {selectedHouseholdId ? (
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.14em] text-amber-700">{labels.deviceArea}</p>
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-amber-200/60 bg-white/65 px-2.5 py-2">
              <div>
                <p className="text-xs font-black text-amber-950">{labels.notifications}</p>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-amber-700">{labels.notificationsSoon}</p>
              </div>
              <button className="min-h-8 rounded-lg border border-stone-200 bg-white px-2.5 text-[0.68rem] font-black text-stone-400 opacity-70" disabled type="button">{labels.enableNotifications}</button>
            </div>
            {isConfirming ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-semibold text-amber-900">{labels.confirm}</p>
                <div className="flex gap-2">
                  <button className="pressable min-h-9 rounded-xl bg-stone-950 px-3 text-xs font-black text-white" onClick={forgetOnDevice} type="button">{labels.forget}</button>
                  <button className="pressable min-h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700" onClick={() => setConfirming(false)} type="button">{labels.cancel}</button>
                </div>
              </div>
            ) : <button className="pressable mt-2 min-h-9 rounded-xl border border-amber-200 bg-white/85 px-3 text-xs font-black text-amber-900" onClick={() => setConfirming(true)} type="button">{labels.forget}</button>}
          </div>
        ) : null}
      </div>
    </SettingsCard>
  );
}
