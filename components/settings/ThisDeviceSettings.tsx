"use client";

import { useEffect, useMemo, useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { signOutParentLocally } from "@/lib/auth/parentAuth";
import { getDeviceAccessPayload, type DeviceAccessPayload } from "@/lib/devices/deviceAccess";
import { getDeviceProfile } from "@/lib/devicePreferences";
import { enableLocalOnlyMode, forgetSelectedCloudHouseholdOnThisDevice } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useLanguage, type Language } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const copy: Record<Language, Record<string, string>> = {
  en: {
    title: "This device",
    active: "Cloud sync active",
    thisDeviceName: "Device name",
    edit: "Edit",
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    notPaired: "Not paired",
    thisDeviceRenameError: "Could not update this device name.",
    forget: "Forget cloud home on this device",
    confirm: "This only forgets the selected cloud home on this device. The home is not deleted in cloud sync.",
  },
  sv: {
    title: "Den här enheten",
    active: "Molnsynk aktiv",
    thisDeviceName: "Enhetsnamn",
    edit: "Ändra",
    save: "Spara",
    saved: "Sparat",
    cancel: "Avbryt",
    notPaired: "Inte parkopplad",
    thisDeviceRenameError: "Kunde inte uppdatera enhetsnamnet.",
    forget: "Glöm molnhem på den här enheten",
    confirm: "Detta glömmer bara valt molnhem på den här enheten. Hemmet raderas inte i molnsynk.",
  },
};

export function ThisDeviceSettings() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { householdId, refreshHouseholdId } = useActiveHousehold();
  const { language } = useLanguage();
  const labels = copy[language];

  const [deviceAccess, setDeviceAccess] = useState<DeviceAccessPayload | null>(null);
  const [hasLoadedDeviceAccess, setHasLoadedDeviceAccess] = useState(false);
  const [isEditingDeviceName, setEditingDeviceName] = useState(false);
  const [deviceNameDraft, setDeviceNameDraft] = useState("");
  const [isSavingDeviceName, setSavingDeviceName] = useState(false);
  const [deviceNameError, setDeviceNameError] = useState<string | null>(null);
  const [deviceSaveState, setDeviceSaveState] = useState<"idle" | "saved">("idle");
  const [isLoadingDeviceName, setLoadingDeviceName] = useState(false);
  const [deviceNameLoaded, setDeviceNameLoaded] = useState("");
  const [isConfirming, setConfirming] = useState(false);

  const cloudDeviceId = deviceAccess?.cloudDeviceId ?? null;
  const localDeviceId = deviceAccess?.localDeviceId ?? null;
  const deviceAccessToken = deviceAccess?.accessToken ?? null;

  useEffect(() => {
    setDeviceAccess(getDeviceAccessPayload());
    setHasLoadedDeviceAccess(true);
  }, []);

  useEffect(() => {
    if (!householdId || !cloudDeviceId || !localDeviceId || !deviceAccessToken || !supabase) {
      setDeviceNameDraft("");
      setDeviceNameLoaded("");
      return;
    }

    let mounted = true;
    setLoadingDeviceName(true);
    setDeviceNameError(null);

    void (async () => {
      try {
        const { data, error } = await supabase.rpc("device_get_own_device", {
          p_household_id: householdId,
          p_cloud_device_id: cloudDeviceId,
          p_local_device_id: localDeviceId,
          p_device_access_token: deviceAccessToken,
        });
        if (!mounted) return;
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        const nextName = typeof row?.name === "string" ? row.name : "";
        setDeviceNameDraft(nextName);
        setDeviceNameLoaded(nextName);
      } catch {
        if (!mounted) return;
        setDeviceNameDraft("");
        setDeviceNameLoaded("");
        setDeviceNameError(labels.thisDeviceRenameError);
      } finally {
        if (!mounted) return;
        setLoadingDeviceName(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [householdId, cloudDeviceId, localDeviceId, deviceAccessToken, labels.thisDeviceRenameError, supabase]);

  async function saveThisDeviceName() {
    if (!householdId || !deviceAccess || !supabase) return;
    const trimmed = deviceNameDraft.trim();
    if (!trimmed || trimmed.length > 40) {
      setDeviceNameError(labels.thisDeviceRenameError);
      return;
    }

    setSavingDeviceName(true);
    setDeviceNameError(null);
    try {
      const { data, error } = await supabase.rpc("device_update_own_name", {
        p_household_id: householdId,
        p_cloud_device_id: deviceAccess.cloudDeviceId,
        p_local_device_id: deviceAccess.localDeviceId,
        p_device_access_token: deviceAccess.accessToken,
        p_name: trimmed,
      });

      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const nextName = typeof row?.name === "string" ? row.name : trimmed;
      setDeviceNameDraft(nextName);
      setDeviceNameLoaded(nextName);
      setDeviceSaveState("saved");
      window.setTimeout(() => {
        setDeviceSaveState("idle");
        setEditingDeviceName(false);
      }, 1150);
    } catch {
      setDeviceNameError(labels.thisDeviceRenameError);
    } finally {
      setSavingDeviceName(false);
    }
  }

  function forgetOnDevice() {
    if (getDeviceProfile() === "wall") void signOutParentLocally();
    forgetSelectedCloudHouseholdOnThisDevice();
    enableLocalOnlyMode();
    refreshHouseholdId();
  }

  return (
    <SettingsCard status={labels.active} title={labels.title}>
      <div className="space-y-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3">
        <div className="rounded-xl border border-amber-200/70 bg-white/70 p-2.5">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-amber-800">{labels.thisDeviceName}</p>
          {!hasLoadedDeviceAccess ? (
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-sm font-black text-stone-700">—</p>
            </div>
          ) : !deviceAccess ? (
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-sm font-black text-stone-700">{labels.notPaired}</p>
            </div>
          ) : !isEditingDeviceName ? (
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-sm font-black text-stone-900">{isLoadingDeviceName ? "—" : (deviceNameDraft.trim() || "—")}</p>
              <button className="pressable min-h-8 rounded-lg border border-amber-200 bg-white px-2.5 text-xs font-black text-amber-900" onClick={() => setEditingDeviceName(true)} type="button">{labels.edit}</button>
            </div>
          ) : (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input className="min-h-9 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-900" maxLength={40} onChange={(event) => { setDeviceNameDraft(event.target.value); setDeviceSaveState("idle"); }} value={deviceNameDraft} />
              <button className={`pressable min-h-9 rounded-xl px-3 text-xs font-black text-white transition-all duration-250 ${deviceSaveState === "saved" ? "bg-emerald-600" : "bg-stone-950"} disabled:opacity-40`} disabled={isSavingDeviceName || !deviceNameDraft.trim()} onClick={() => void saveThisDeviceName()} type="button">{deviceSaveState === "saved" ? labels.saved : labels.save}</button>
              <button className="pressable min-h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700" onClick={() => { setEditingDeviceName(false); setDeviceNameError(null); setDeviceSaveState("idle"); setDeviceNameDraft(deviceNameLoaded); }} type="button">{labels.cancel}</button>
            </div>
          )}
          {deviceNameError ? <p className="mt-1.5 text-xs font-semibold text-rose-700">{deviceNameError}</p> : null}
        </div>

        {isConfirming ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-900">{labels.confirm}</p>
            <div className="flex gap-2">
              <button className="pressable min-h-9 rounded-xl bg-stone-950 px-3 text-xs font-black text-white" onClick={forgetOnDevice} type="button">{labels.forget}</button>
              <button className="pressable min-h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700" onClick={() => setConfirming(false)} type="button">{labels.cancel}</button>
            </div>
          </div>
        ) : <button className="pressable min-h-9 rounded-xl border border-amber-200 bg-white/85 px-3 text-xs font-black text-amber-900" onClick={() => setConfirming(true)} type="button">{labels.forget}</button>}
      </div>
    </SettingsCard>
  );
}
