"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ParentAuthCard } from "@/components/auth/ParentAuthCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { usePairingCode } from "@/lib/hooks/useDevicePairing";
import { useParentAuth } from "@/lib/hooks/useParentAuth";
import { useLanguage, type Language } from "@/lib/i18n";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { createHouseholdService } from "@/lib/services/householdService";
import type { Household } from "@/types";

const service = createHouseholdService(householdRepository);
type PairingDeviceKind = "wall" | "mobile" | "generic";
const pairingCopy: Record<Language, { claimFailed: string; chooseHome: string; noHomes: string; homesFailed: string; expiredHint: string; codeHelp: string; manualTitle: string; codeDetected: string; continueCta: string; closeToMobile: string; deviceNameLabel: string; deviceNameHelper: string; saveDeviceName: string; deviceNameSaved: string; deviceNameSaveError: string; successHelper: Record<PairingDeviceKind, string>; deviceNames: Record<PairingDeviceKind, string>; connectTitle: Record<PairingDeviceKind, string>; confirmHome: Record<PairingDeviceKind, string>; connectSubmit: Record<PairingDeviceKind, string>; successDone: Record<PairingDeviceKind, string>; successBody: Record<PairingDeviceKind, string> }> = {
  en: {
    claimFailed: "Could not connect this device. Try again.",
    chooseHome: "Choose home",
    noHomes: "No cloud homes found yet. Create a home in Settings first.",
    homesFailed: "Could not load your homes right now. Try again.",
    expiredHint: "The code expired. Return to the device to create a new code.",
    codeHelp: "Enter the pairing code shown on the other device. This is not the sign-in code from your email.",
    manualTitle: "Enter pairing code",
    codeDetected: "Detected pairing code",
    continueCta: "Continue",
    closeToMobile: "Close and return to mobile view",
    deviceNameLabel: "Device name",
    deviceNameHelper: "Give this screen a name so it is easy to recognize in Settings.",
    saveDeviceName: "Save name",
    deviceNameSaved: "Name saved",
    deviceNameSaveError: "Could not save the name right now. Try again.",
    successHelper: { wall: "The wall screen will open your home automatically. You can continue here on your phone.", mobile: "You can continue here on your phone.", generic: "You can continue here on your phone." },
    deviceNames: { wall: "wall screen", mobile: "phone", generic: "device" },
    connectTitle: { wall: "Connect wall screen", mobile: "Connect phone", generic: "Connect device" },
    confirmHome: { wall: "Do you want to connect this wall screen to", mobile: "Do you want to connect this phone to", generic: "Do you want to connect this device to" },
    connectSubmit: { wall: "Connect wall screen", mobile: "Connect phone", generic: "Connect device" },
    successDone: { wall: "Done! The wall screen is connected.", mobile: "Done! The phone is connected.", generic: "Done! The device is connected." },
    successBody: { wall: "Connected! Opening wall view now.", mobile: "Connected! Opening HomeBoard now.", generic: "Connected! Opening HomeBoard now." },
  },
  sv: {
    claimFailed: "Kunde inte koppla den här enheten. Försök igen.",
    chooseHome: "Välj hem",
    noHomes: "Inga molnhem hittades ännu. Skapa först ett hem i Inställningar.",
    homesFailed: "Kunde inte ladda dina hem just nu. Försök igen.",
    expiredHint: "Koden har gått ut. Gå tillbaka till enheten och skapa en ny kod.",
    codeHelp: "Ange parkoden som visas på den andra enheten. Det är inte inloggningskoden från mejlet.",
    manualTitle: "Ange parkod",
    codeDetected: "Upptäckt parkod",
    continueCta: "Fortsätt",
    closeToMobile: "Stäng och gå tillbaka till mobilvyn",
    deviceNameLabel: "Namn på enheten",
    deviceNameHelper: "Ge skärmen ett namn så den blir lätt att känna igen i Inställningar.",
    saveDeviceName: "Spara namn",
    deviceNameSaved: "Namnet är sparat",
    deviceNameSaveError: "Kunde inte spara namnet just nu. Försök igen.",
    successHelper: { wall: "Väggskärmen öppnar hemmet automatiskt. Du kan fortsätta här på mobilen.", mobile: "Du kan fortsätta här på mobilen.", generic: "Du kan fortsätta här på mobilen." },
    deviceNames: { wall: "väggskärmen", mobile: "mobilen", generic: "enheten" },
    connectTitle: { wall: "Koppla väggskärm", mobile: "Koppla mobil", generic: "Koppla enhet" },
    confirmHome: { wall: "Vill du koppla den här väggskärmen till", mobile: "Vill du koppla den här mobilen till", generic: "Vill du koppla den här enheten till" },
    connectSubmit: { wall: "Koppla väggskärmen", mobile: "Koppla mobilen", generic: "Koppla enheten" },
    successDone: { wall: "Klart! Väggskärmen är kopplad.", mobile: "Klart! Mobilen är kopplad.", generic: "Klart! Enheten är kopplad." },
    successBody: { wall: "Kopplad! Nu öppnar vi väggvyn.", mobile: "Kopplad! Nu öppnar vi HomeBoard.", generic: "Kopplad! Nu öppnar vi HomeBoard." },
  },
};

function PairDeviceContent() {
  const router = useRouter();
  const params = useSearchParams();
  const pairingCode = params.get("code");
  const { language, t } = useLanguage();
  const copy = pairingCopy[language];
  const { claim, error, isLoading, session, updateDeviceName } = usePairingCode(pairingCode);
  const { isSignedIn } = useParentAuth();
  const [isClaiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [homes, setHomes] = useState<Household[]>([]);
  const [isLoadingHomes, setLoadingHomes] = useState(false);
  const [homesError, setHomesError] = useState<string | null>(null);
  const [selectedHomeId, setSelectedHomeId] = useState<string>("");
  const [manualCode, setManualCode] = useState(() => pairingCode?.trim().toUpperCase() ?? "");
  const [deviceName, setDeviceName] = useState("");
  const [isSavingDeviceName, setSavingDeviceName] = useState(false);
  const [deviceNameState, setDeviceNameState] = useState<"idle" | "saved" | "error">("idle");
  const isExpired = session?.status === "expired";
  const isClaimed = session?.status === "claimed";
  const pairDeviceKind: PairingDeviceKind = useMemo(() => {
    if (session?.deviceMode === "wall") return "wall";
    if (session?.deviceMode === "mobile") return "mobile";
    return "generic";
  }, [session?.deviceMode]);
  const hasManualCode = manualCode.length === 6;

  useEffect(() => {
    setManualCode(pairingCode?.trim().toUpperCase() ?? "");
  }, [pairingCode]);

  useEffect(() => {
    if (!isClaimed) return;
    setDeviceName(session?.deviceName?.trim() || (language === "sv" ? "Väggskärm" : "Wall screen"));
  }, [isClaimed, language, session?.deviceName]);

  useEffect(() => {
    if (!isSignedIn || !session || session.status !== "pending") return;
    let mounted = true;
    setLoadingHomes(true);
    setHomesError(null);
    service
      .listHouseholds()
      .then((next) => {
        if (!mounted) return;
        setHomes(next);
        setSelectedHomeId((current) => current || next[0]?.id || "");
      })
      .catch(() => {
        if (!mounted) return;
        setHomes([]);
        setHomesError(copy.homesFailed);
      })
      .finally(() => {
        if (mounted) setLoadingHomes(false);
      });

    return () => {
      mounted = false;
    };
  }, [copy.homesFailed, isSignedIn, session]);

  const canClaim = Boolean(selectedHomeId && session?.status === "pending" && isSignedIn && homes.length > 0 && !homesError);

  async function claimPairing() {
    if (!selectedHomeId) return;
    setClaiming(true);
    setClaimError(null);
    try {
      await claim(selectedHomeId);
    } catch (unknownError) {
      console.warn("HomeBoard could not claim the pairing session.", unknownError);
      setClaimError("claim_failed");
    } finally {
      setClaiming(false);
    }
  }

  async function saveClaimedDeviceName() {
    if (!session?.deviceId) return;
    const nextName = deviceName.trim().slice(0, 40);
    if (!nextName) return;
    setSavingDeviceName(true);
    setDeviceNameState("idle");
    try {
      await updateDeviceName(session.deviceId, nextName);
      setDeviceName(nextName);
      setDeviceNameState("saved");
    } catch {
      setDeviceNameState("error");
    } finally {
      setSavingDeviceName(false);
    }
  }

  const selectedHome = homes.find((home) => home.id === selectedHomeId);
  const pairStep = isClaimed ? 3 : pairingCode ? 2 : 1;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-8">
      <section className="surface-card relative w-full overflow-hidden rounded-[2.25rem] p-5 shadow-xl shadow-amber-900/5 sm:p-7">
        <button aria-label={copy.closeToMobile} className="pressable absolute left-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-full border border-white/70 bg-white/70 text-lg font-black text-stone-700 shadow-sm backdrop-blur-xl transition-colors duration-150 hover:bg-white/90" onClick={() => router.push("/app")} type="button">×</button>
        <div className="pointer-events-none absolute -right-12 top-6 h-36 w-36 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-300" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{pairingCode ? copy.connectTitle[pairDeviceKind] : t("pairPhoneTitle")}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-950">{pairingCode ? copy.connectTitle[pairDeviceKind] : copy.manualTitle}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{copy.codeHelp}</p>
        {pairingCode ? <p className="mt-4 inline-flex rounded-full bg-stone-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-stone-700">{copy.codeDetected}: <span className="ml-2 text-stone-900">{pairingCode.trim().toUpperCase()}</span></p> : null}

        {isLoading ? <p className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-600">{t("loading")}</p> : null}
        {!pairingCode ? (
          <form action="/pair" className="mt-5 space-y-3 rounded-[1.5rem] border border-stone-200 bg-gradient-to-br from-white to-amber-50/50 p-4 shadow-sm" method="get">
            <label className="block text-left">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{t("pairCodeLabel")}</span>
              <input
                autoCapitalize="characters"
                autoComplete="one-time-code"
                className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-black tracking-[0.18em] text-stone-950 uppercase"
                inputMode="text"
                maxLength={6}
                name="code"
                onChange={(event) => setManualCode(event.target.value.replace(/\s+/g, "").toUpperCase())}
                placeholder="ABC123"
                value={manualCode}
              />
            </label>
            <button className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={!hasManualCode} type="submit">{copy.continueCta}</button>
          </form>
        ) : null}
        <div className={`cloud-mode-card mt-4 rounded-2xl border p-4 ${isClaimed ? "cloud-mode-card--celebrating" : pairingCode ? "cloud-mode-card--active" : ""}`}>
          <div className="cloud-mode-card__shine" />
          <div className="cloud-milestone-stage">
            <p className="cloud-connection-path">{copy.deviceNames[pairDeviceKind]} <i /><i /><i /> {t("home")}</p>
            <ol className="cloud-milestone-steps">
                <li className={`cloud-milestone-step ${pairStep >= 1 ? "cloud-milestone-step--active" : ""}`}><span />{copy.manualTitle}</li>
              <li className={`cloud-milestone-step ${pairStep >= 2 ? "cloud-milestone-step--active" : ""}`}><span />{copy.connectTitle[pairDeviceKind]}</li>
              <li className={`cloud-milestone-step ${pairStep >= 3 ? "cloud-milestone-step--active" : ""}`}><span />{copy.successDone[pairDeviceKind]}</li>
            </ol>
          </div>
        </div>
        {(pairingCode && (error || !session)) ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{t("pairCodeInvalid")}</p> : null}
        {isExpired ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{copy.expiredHint}</p> : null}
        {error === "unavailable" ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{t("pairCloudUnavailable")}</p> : null}
        {claimError ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{copy.claimFailed}</p> : null}

        {!isSignedIn && session?.status === "pending" ? <div className="mt-5"><ParentAuthCard compact /></div> : null}

        {isClaimed ? (
          <div className="cloud-success-copy cloud-success-copy--celebrating mt-5 space-y-4">
            <StatusChip tone="emerald">{copy.successDone[pairDeviceKind]}</StatusChip>
            <p className="text-base font-bold leading-7 text-stone-600">{copy.successBody[pairDeviceKind]}</p>
            <p className="text-sm font-semibold leading-6 text-stone-600">{copy.successHelper[pairDeviceKind]}</p>
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-stone-500">{copy.deviceNameLabel}</label>
              <p className="mt-1 text-xs font-semibold text-stone-600">{copy.deviceNameHelper}</p>
              <div className="mt-2 flex gap-2">
                <input className="min-h-11 flex-1 rounded-xl border border-stone-200 px-3 font-semibold text-stone-900" maxLength={40} onChange={(event) => { setDeviceName(event.target.value); setDeviceNameState("idle"); }} value={deviceName} />
                <button className="pressable min-h-11 rounded-xl bg-stone-950 px-3 text-sm font-black text-white disabled:opacity-60" disabled={isSavingDeviceName || !deviceName.trim()} onClick={() => void saveClaimedDeviceName()} type="button">{copy.saveDeviceName}</button>
              </div>
              {deviceNameState === "saved" ? <p className="mt-2 text-xs font-bold text-emerald-700">{copy.deviceNameSaved}</p> : null}
              {deviceNameState === "error" ? <p className="mt-2 text-xs font-bold text-rose-700">{copy.deviceNameSaveError}</p> : null}
            </div>
            <Link className="pressable inline-flex min-h-12 items-center rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15" href="/app">{t("open")}</Link>
          </div>
        ) : null}

        {isSignedIn && !isClaimed && session?.status === "pending" ? (
          <div className="mt-5 space-y-5">
            {homesError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">{homesError}</p> : null}
            {!isLoadingHomes && !homesError && homes.length === 0 ? (
              <div className="space-y-3">
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{copy.noHomes}</p>
                <Link className="pressable inline-flex min-h-11 items-center rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800" href="/settings">{t("settings")}</Link>
              </div>
            ) : null}
            {homes.length > 0 ? (
              <>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{copy.chooseHome}</span>
                  <select className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-bold text-stone-950" disabled={isLoadingHomes} onChange={(event) => setSelectedHomeId(event.target.value)} value={selectedHomeId}>
                    {homes.map((home) => <option key={home.id} value={home.id}>{home.name}</option>)}
                  </select>
                </label>
                <p className="text-lg font-bold leading-8 text-stone-700">{copy.confirmHome[pairDeviceKind]} <span className="font-black text-stone-950">{selectedHome?.name ?? t("home")}</span>?</p>
                <button className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={isClaiming || !canClaim} onClick={claimPairing} type="button">{isClaiming ? t("saving") : copy.connectSubmit[pairDeviceKind]}</button>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function PairDevicePage() {
  return <PairDeviceContent />;
}
