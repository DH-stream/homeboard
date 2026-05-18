"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HouseholdSetupGate } from "@/components/households/HouseholdSetupGate";
import { StatusChip } from "@/components/ui/StatusChip";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { usePairingCode } from "@/lib/hooks/useDevicePairing";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { useLanguage, type Language } from "@/lib/i18n";

const pairingCopy: Record<Language, { claimFailed: string }> = {
  en: {
    claimFailed: "Could not connect the wall screen. Try again.",
  },
  sv: {
    claimFailed: "Kunde inte koppla väggskärmen. Försök igen.",
  },
};

function PairDeviceContent() {
  const params = useSearchParams();
  const pairingCode = params.get("code");
  const { language, t } = useLanguage();
  const copy = pairingCopy[language];
  const { household, householdId } = useActiveHousehold();
  const { claim, error, isLoading, session } = usePairingCode(pairingCode);
  const [isClaiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const isExpired = session?.status === "expired";
  const isClaimed = session?.status === "claimed";
  const canClaim = Boolean(householdId && session?.status === "pending");

  async function claimPairing() {
    if (!householdId) return;
    setClaiming(true);
    setClaimError(null);
    try {
      await claim(householdId);
    } catch (unknownError) {
      console.warn("HomeBoard could not claim the wall pairing session.", unknownError);
      setClaimError("claim_failed");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-8">
      <section className="surface-card w-full rounded-[2.25rem] p-5 shadow-xl shadow-amber-900/5 sm:p-7">
        <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-300" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{t("pairPhoneTitle")}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-950">{t("pairPhoneTitle")}</h1>

        {isLoading ? <p className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-600">{t("loading")}</p> : null}
        {error || !session ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{t("pairCodeInvalid")}</p> : null}
        {isExpired ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{t("pairCodeExpiredPhone")}</p> : null}
        {claimError ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{copy.claimFailed}</p> : null}

        {isClaimed ? (
          <div className="mt-5 space-y-4">
            <StatusChip tone="emerald">{t("pairComplete")}</StatusChip>
            <p className="text-base font-bold leading-7 text-stone-600">{t("pairComplete")}</p>
            <Link className="pressable inline-flex min-h-12 items-center rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15" href="/app">
              {t("open")}
            </Link>
          </div>
        ) : null}

        {canClaim && !isClaimed ? (
          <div className="mt-5 space-y-5">
            <p className="text-lg font-bold leading-8 text-stone-700">
              {t("pairConfirmPrefix")} <span className="font-black text-stone-950">{household?.name ?? t("home")}</span>{t("pairConfirmSuffix")}
            </p>
            <button className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={isClaiming} onClick={claimPairing} type="button">
              {isClaiming ? t("saving") : t("pairSubmit")}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function PairDevicePage() {
  const { householdId } = useResolvedHouseholdId();

  if (!householdId) {
    return (
      <HouseholdSetupGate>
        <PairDeviceContent />
      </HouseholdSetupGate>
    );
  }

  return <PairDeviceContent />;
}
