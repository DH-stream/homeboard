"use client";

import { useEffect, useMemo, useState } from "react";
import { getDeviceAccessPayload, type DeviceAccessPayload } from "@/lib/devices/deviceAccess";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { signOutParentLocally } from "@/lib/auth/parentAuth";
import { getDeviceProfile } from "@/lib/devicePreferences";
import { enableLocalOnlyMode, forgetSelectedCloudHouseholdOnThisDevice } from "@/lib/households/selection";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useCloudDiagnostics } from "@/lib/hooks/useCloudDiagnostics";
import { useLanguage, type Language } from "@/lib/i18n";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { AdultAccessRequestError, approveAdultAccessRequest, denyAdultAccessRequest, listAdultAccessRequests, type AdultAccessRequestRecord } from "@/lib/services/adultAccessService";

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
    forget: "Forget cloud home on this device",
    confirm: "This only forgets the selected cloud home on this device. The home is not deleted in cloud sync.",
    members: "Members",
    thisDeviceName: "Device name",
    thisDeviceRenameError: "Could not update this device name.",
    notPaired: "Not paired",
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
    forget: "Glöm molnhem på den här enheten",
    confirm: "Detta glömmer bara valt molnhem på den här enheten. Hemmet raderas inte i molnsynk.",
    members: "Medlemmar",
    thisDeviceName: "Enhetsnamn",
    thisDeviceRenameError: "Kunde inte uppdatera enhetsnamnet.",
    notPaired: "Inte parkopplad",
  },
};

export function HouseholdSettings() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { household, householdId, refresh, refreshHouseholdId } = useActiveHousehold();
  const { diagnostics, refresh: refreshCloudDiagnostics } = useCloudDiagnostics();
  const { language } = useLanguage();
  const labels = copy[language];
  const hasCloudHousehold = Boolean(householdId);
  const [deviceAccess, setDeviceAccess] = useState<DeviceAccessPayload | null>(null);
  const [hasLoadedDeviceAccess, setHasLoadedDeviceAccess] = useState(false);
  const cloudDeviceId = deviceAccess?.cloudDeviceId ?? null;
  const localDeviceId = deviceAccess?.localDeviceId ?? null;
  const deviceAccessToken = deviceAccess?.accessToken ?? null;

  const [isEditingName, setEditingName] = useState(false);
  const [homeNameDraft, setHomeNameDraft] = useState("");
  const [isSavingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [isEditingDeviceName, setEditingDeviceName] = useState(false);
  const [deviceNameDraft, setDeviceNameDraft] = useState("");
  const [isSavingDeviceName, setSavingDeviceName] = useState(false);
  const [deviceNameError, setDeviceNameError] = useState<string | null>(null);
  const [deviceSaveState, setDeviceSaveState] = useState<"idle" | "saved">("idle");
  const [isLoadingDeviceName, setLoadingDeviceName] = useState(false);
  const [deviceNameLoaded, setDeviceNameLoaded] = useState("");
  const [isCloudOpen, setCloudOpen] = useState(false);
  const [isConfirming, setConfirming] = useState(false);
  const [requests, setRequests] = useState<AdultAccessRequestRecord[]>([]);
  const [isLoadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  useEffect(() => {
    setDeviceAccess(getDeviceAccessPayload());
    setHasLoadedDeviceAccess(true);
  }, []);
  useEffect(() => setHomeNameDraft(household?.name ?? ""), [household?.name]);
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
  useEffect(() => {
    if (!householdId) {
      setRequests([]);
      return;
    }
    let mounted = true;
    setLoadingRequests(true);
    setRequestError(null);
    void listAdultAccessRequests(householdId)
      .then((items) => {
        if (!mounted) return;
        setRequests(items.filter((item) => item.status === "pending"));
      })
      .catch(() => {
        if (!mounted) return;
        setRequestError(language === "sv" ? "Kunde inte hämta åtkomstförfrågningar." : "Could not load access requests.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingRequests(false);
      });
    return () => {
      mounted = false;
    };
  }, [householdId, language]);

  async function handleRequestAction(requestId: string, action: "approve" | "deny") {
    if (busyRequestId) return;
    setBusyRequestId(requestId);
    setRequestError(null);
    setRequestNotice(null);
    try {
      if (action === "approve") {
        await approveAdultAccessRequest(requestId);
      } else {
        await denyAdultAccessRequest(requestId);
      }
      setRequests((prev) => prev.filter((request) => request.requestId !== requestId));
      setRequestNotice(language === "sv" ? (action === "approve" ? "Förfrågan godkänd." : "Förfrågan nekad.") : (action === "approve" ? "Request approved." : "Request denied."));
    } catch (error) {
      const message = error instanceof AdultAccessRequestError ? error.message : "";
      setRequestError(message || (language === "sv" ? "Kunde inte uppdatera förfrågan." : "Could not update request."));
    } finally {
      setBusyRequestId(null);
    }
  }

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

        {hasCloudHousehold ? (
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.14em] text-amber-700">{labels.deviceArea}</p>
            <div className="mt-2 rounded-xl border border-amber-200/70 bg-white/70 p-2.5">
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
        <div className="rounded-2xl border border-stone-200/70 bg-stone-50/90 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-stone-500">{language === "sv" ? "Åtkomstförfrågningar" : "Access requests"}</p>
            <p className="text-xs font-bold text-stone-600">{isLoadingRequests ? (language === "sv" ? "Hämtar…" : "Loading…") : requests.length > 0 ? `${requests.length}` : (language === "sv" ? "Inga väntande" : "No pending")}</p>
          </div>
          {requests.length === 0 && !isLoadingRequests ? (
            <p className="mt-2 text-xs font-semibold text-stone-600">{language === "sv" ? "Inga väntande förfrågningar" : "No pending requests"}</p>
          ) : null}
          {requests.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {requests.map((request) => (
                <li className="rounded-xl border border-stone-200 bg-white/90 p-2.5" key={request.requestId}>
                  <p className="text-xs font-semibold text-stone-700">{`${request.deviceName || (language === "sv" ? "Okänd enhet" : "Unknown device")} ${language === "sv" ? "vill ha vuxenåtkomst" : "wants adult access"}`}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="pressable min-h-8 rounded-lg bg-stone-950 px-2.5 text-[0.68rem] font-black text-white disabled:opacity-50" disabled={busyRequestId === request.requestId} onClick={() => void handleRequestAction(request.requestId, "approve")} type="button">{language === "sv" ? "Godkänn" : "Approve"}</button>
                    <button className="pressable min-h-8 rounded-lg border border-stone-200 bg-white px-2.5 text-[0.68rem] font-black text-stone-700 disabled:opacity-50" disabled={busyRequestId === request.requestId} onClick={() => void handleRequestAction(request.requestId, "deny")} type="button">{language === "sv" ? "Neka" : "Deny"}</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {requestNotice ? <p className="mt-2 text-xs font-semibold text-emerald-700">{requestNotice}</p> : null}
          {requestError ? <p className="mt-2 text-xs font-semibold text-rose-700">{requestError}</p> : null}
        </div>
      </div>
    </SettingsCard>
  );
}
