"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { StatusChip } from "@/components/ui/StatusChip";
import { useWallDevicePairing } from "@/lib/hooks/useDevicePairing";
import { useLanguage } from "@/lib/i18n";

function getSecondsLeft(expiresAt?: string) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function WallPairingCard({ onPaired, onUseLocal }: { onPaired: (householdId: string) => void; onUseLocal: () => void }) {
  const { t, language } = useLanguage();
  const { canPair, createSession, error, isLoading, session } = useWallDevicePairing(true);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsLeft(session?.expiresAt));

  const pairingUrl = useMemo(() => {
    if (!session?.pairingCode || typeof window === "undefined") return null;
    return `${window.location.origin}/pair?code=${encodeURIComponent(session.pairingCode)}`;
  }, [session?.pairingCode]);

  useEffect(() => setSecondsLeft(getSecondsLeft(session?.expiresAt)), [session?.expiresAt]);

  useEffect(() => {
    if (!session?.expiresAt || session.status !== "pending") return;
    const timer = window.setInterval(() => setSecondsLeft(getSecondsLeft(session.expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [session?.expiresAt, session?.status]);

  useEffect(() => {
    if (!pairingUrl) {
      setQrCodeSvg(null);
      return;
    }

    QRCode.toString(pairingUrl, { errorCorrectionLevel: "M", margin: 2, type: "svg", width: 320 })
      .then(setQrCodeSvg)
      .catch((unknownError: unknown) => {
        console.warn("HomeBoard could not render the wall pairing QR code.", unknownError);
        setQrCodeSvg(null);
      });
  }, [pairingUrl]);

  const isExpired = session?.status === "expired" || (session?.status === "pending" && secondsLeft <= 0);
  const isClaimed = session?.status === "claimed" && Boolean(session.householdId);
  const showUnavailable = !canPair || error;

  useEffect(() => {
    if (session?.status === "claimed" && session.householdId) onPaired(session.householdId);
  }, [onPaired, session?.householdId, session?.status]);

  const countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 text-stone-950 sm:px-8">
      <section className="surface-card grid w-full gap-6 rounded-[2.5rem] p-5 shadow-2xl shadow-amber-950/10 md:grid-cols-[1fr_0.95fr] md:p-8">
        <div className="flex min-h-[28rem] flex-col justify-between rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-50 to-stone-100 p-6 shadow-inner shadow-white/60">
          <div>
            <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-300" />
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700">{t("pairWallTitle")}</p>
            <h1 className="mt-3 max-w-2xl text-5xl font-black tracking-tight text-stone-950 md:text-6xl">{t("pairScanTitle")}</h1>
            <p className="mt-4 max-w-xl text-xl font-bold leading-8 text-stone-600">{t("pairScanBody")}</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <StatusChip tone={isClaimed ? "emerald" : isExpired || showUnavailable ? "amber" : "stone"}>{isClaimed ? t("pairSuccessWall") : isExpired ? t("pairCodeExpired") : showUnavailable ? t("cloudSyncUnreachable") : t("pairWaiting")}</StatusChip>
            {session?.pairingCode ? <span className="rounded-full bg-white/80 px-4 py-2 text-lg font-black tracking-[0.24em] text-stone-900 shadow-sm ring-1 ring-black/5">{session.pairingCode}</span> : null}
            {session?.status === "pending" ? <span className="text-sm font-bold text-stone-600">{language === "sv" ? `Går ut om ${countdown}` : `Expires in ${countdown}`}</span> : null}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-stone-200/80 bg-white/80 p-5 text-center shadow-sm">
          {qrCodeSvg && !isExpired && !showUnavailable ? <div aria-label={t("pairScanTitle")} className="h-72 w-72 rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-stone-200 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qrCodeSvg }} role="img" /> : null}
          {isLoading ? <p className="text-lg font-black text-stone-700">{t("loading")}</p> : null}
          {showUnavailable ? <p className="max-w-sm text-base font-bold leading-7 text-stone-600">{t("pairCloudUnavailable")}</p> : null}
          {isExpired ? <p className="max-w-sm text-base font-bold leading-7 text-amber-900">{t("pairCodeExpired")}</p> : null}
          {session?.pairingCode ? <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-stone-400">{t("pairCodeLabel")}</p> : null}
          {session?.pairingCode ? <p className="mt-1 text-4xl font-black tracking-[0.18em] text-stone-950">{session.pairingCode}</p> : null}
          {isExpired ? (
            <button className="pressable mt-5 min-h-12 rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15" onClick={createSession} type="button">
              {t("pairCreateNewCode")}
            </button>
          ) : null}
          {showUnavailable ? (
            <button className="pressable mt-5 min-h-12 rounded-2xl border border-stone-200 bg-white px-5 py-3 font-black text-stone-800 shadow-sm" onClick={onUseLocal} type="button">
              {t("pairOpenLocal")}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
