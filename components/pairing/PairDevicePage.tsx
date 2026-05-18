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
const pairingCopy: Record<Language, { claimFailed: string; successBody: string; chooseHome: string; confirmHome: string }> = {
  en: {
    claimFailed: "Could not connect the wall screen. Try again.",
    successBody: "The wall screen will open this home in a moment.",
    chooseHome: "Choose home",
    confirmHome: "Connect this wall screen to",
  },
  sv: {
    claimFailed: "Kunde inte koppla väggskärmen. Försök igen.",
    successBody: "Väggskärmen öppnar hemmet om en liten stund.",
    chooseHome: "Välj hem",
    confirmHome: "Koppla den här väggskärmen till",
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
  const [selectedHomeId, setSelectedHomeId] = useState<string>("");
  const isExpired = session?.status === "expired";
  const isClaimed = session?.status === "claimed";

  useEffect(() => {
    if (!isSignedIn) return;
    setLoadingHomes(true);
    service.listHouseholds().then((next) => {
      setHomes(next);
      setSelectedHomeId((current) => current || next[0]?.id || "");
    }).finally(() => setLoadingHomes(false));
  }, [isSignedIn]);

  const canClaim = Boolean(selectedHomeId && session?.status === "pending" && isSignedIn);

  async function claimPairing() {
    if (!selectedHomeId) return;
    setClaiming(true);
    setClaimError(null);
    try {
      await claim(selectedHomeId);
    } catch (unknownError) {
      console.warn("HomeBoard could not claim the wall pairing session.", unknownError);
      setClaimError("claim_failed");
    } finally {
      setClaiming(false);
    }
  }

  const selectedHome = homes.find((home) => home.id === selectedHomeId);

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

        {!isSignedIn ? <div className="mt-5"><ParentAuthCard compact /></div> : null}

        {isClaimed ? (
          <div className="mt-5 space-y-4">
            <StatusChip tone="emerald">{t("pairComplete")}</StatusChip>
            <p className="text-base font-bold leading-7 text-stone-600">{copy.successBody}</p>
            <Link className="pressable inline-flex min-h-12 items-center rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15" href="/app">
              {t("open")}
            </Link>
          </div>
        ) : null}

        {isSignedIn && !isClaimed && session?.status === "pending" ? (
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{copy.chooseHome}</span>
              <select className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-bold text-stone-950" disabled={isLoadingHomes} onChange={(event) => setSelectedHomeId(event.target.value)} value={selectedHomeId}>
                {homes.map((home) => <option key={home.id} value={home.id}>{home.name}</option>)}
              </select>
            </label>
            <p className="text-lg font-bold leading-8 text-stone-700">{copy.confirmHome} <span className="font-black text-stone-950">{selectedHome?.name ?? t("home")}</span>?</p>
            <button className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={isClaiming || !canClaim} onClick={claimPairing} type="button">
              {isClaiming ? t("saving") : t("pairSubmit")}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function PairDevicePage() {
  return <PairDeviceContent />;
}
