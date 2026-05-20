"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ParentAuthCard } from "@/components/auth/ParentAuthCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { usePairingCode } from "@/lib/hooks/useDevicePairing";
import { useParentAuth } from "@/lib/hooks/useParentAuth";
import { useLanguage, type Language } from "@/lib/i18n";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { createHouseholdService } from "@/lib/services/householdService";
import type { Household } from "@/types";

const service = createHouseholdService(householdRepository);
const pairingCopy: Record<Language, { claimFailed: string; successBody: string; chooseHome: string; confirmHome: string; noHomes: string; homesFailed: string; expiredHint: string; codeHelp: string; connectTitle: string; manualTitle: string; connectWall: string; codeDetected: string; continueCta: string }> = {
  en: {
    claimFailed: "Could not connect this device. Try again.",
    successBody: "This device will open the selected home in a moment.",
    chooseHome: "Choose home",
    confirmHome: "Connect this device to",
    noHomes: "No cloud homes found yet. Create a home in Settings first.",
    homesFailed: "Could not load your homes right now. Try again.",
    expiredHint: "The code expired. Return to the device to create a new code.",
    codeHelp: "Enter the pairing code shown on the wall screen. This is not the sign-in code from your email.",
    connectTitle: "Connect this wall screen to your home",
    manualTitle: "Enter pairing code",
    connectWall: "Connect wall screen",
    codeDetected: "Detected pairing code",
    continueCta: "Continue",
  },
  sv: {
    claimFailed: "Kunde inte koppla den här enheten. Försök igen.",
    successBody: "Den här enheten öppnar valt hem om en liten stund.",
    chooseHome: "Välj hem",
    confirmHome: "Koppla den här enheten till",
    noHomes: "Inga molnhem hittades ännu. Skapa först ett hem i Inställningar.",
    homesFailed: "Kunde inte ladda dina hem just nu. Försök igen.",
    expiredHint: "Koden har gått ut. Gå tillbaka till enheten och skapa en ny kod.",
    codeHelp: "Ange parkoden som visas på väggskärmen. Det är inte inloggningskoden från mejlet.",
    connectTitle: "Koppla den här väggskärmen till ditt hem",
    manualTitle: "Ange parkod",
    connectWall: "Koppla väggskärm",
    codeDetected: "Upptäckt parkod",
    continueCta: "Fortsätt",
  },
};

function PairDeviceContent() {
  const params = useSearchParams();
  const pairingCode = params.get("code");
  const { language, t } = useLanguage();
  const copy = pairingCopy[language];
  const { claim, error, isLoading, session } = usePairingCode(pairingCode);
  const { isSignedIn } = useParentAuth();
  const [isClaiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [homes, setHomes] = useState<Household[]>([]);
  const [isLoadingHomes, setLoadingHomes] = useState(false);
  const [homesError, setHomesError] = useState<string | null>(null);
  const [selectedHomeId, setSelectedHomeId] = useState<string>("");
  const [manualCode, setManualCode] = useState(() => pairingCode?.trim().toUpperCase() ?? "");
  const isExpired = session?.status === "expired";
  const isClaimed = session?.status === "claimed";
  const hasManualCode = manualCode.length === 6;

  useEffect(() => {
    setManualCode(pairingCode?.trim().toUpperCase() ?? "");
  }, [pairingCode]);

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

  const selectedHome = homes.find((home) => home.id === selectedHomeId);
  const pairStep = isClaimed ? 3 : pairingCode ? 2 : 1;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-8">
      <section className="surface-card relative w-full overflow-hidden rounded-[2.25rem] p-5 shadow-xl shadow-amber-900/5 sm:p-7">
        <div className="pointer-events-none absolute -right-12 top-6 h-36 w-36 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-300" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{t("pairPhoneTitle")}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-950">{pairingCode ? copy.connectTitle : copy.manualTitle}</h1>
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
            <p className="cloud-connection-path">{t("deviceModeWall")} <i /><i /><i /> {t("home")}</p>
            <ol className="cloud-milestone-steps">
              <li className={`cloud-milestone-step ${pairStep >= 1 ? "cloud-milestone-step--active" : ""}`}><span />{copy.manualTitle}</li>
              <li className={`cloud-milestone-step ${pairStep >= 2 ? "cloud-milestone-step--active" : ""}`}><span />{copy.connectTitle}</li>
              <li className={`cloud-milestone-step ${pairStep >= 3 ? "cloud-milestone-step--active" : ""}`}><span />{t("pairComplete")}</li>
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
            <StatusChip tone="emerald">{t("pairComplete")}</StatusChip>
            <p className="text-base font-bold leading-7 text-stone-600">{copy.successBody}</p>
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
                <p className="text-lg font-bold leading-8 text-stone-700">{copy.confirmHome} <span className="font-black text-stone-950">{selectedHome?.name ?? t("home")}</span>?</p>
                <button className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={isClaiming || !canClaim} onClick={claimPairing} type="button">{isClaiming ? t("saving") : copy.connectWall}</button>
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
