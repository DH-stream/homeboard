"use client";

import { useEffect, useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { StatusChip } from "@/components/ui/StatusChip";
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
    members: "Medlemmar",
  },
};

export function HouseholdSettings() {
  const { household, householdId, refresh } = useActiveHousehold();
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
  const [requests, setRequests] = useState<AdultAccessRequestRecord[]>([]);
  const [isLoadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

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
