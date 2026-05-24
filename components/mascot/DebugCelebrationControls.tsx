"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HomeBoardMascotMoment,
  type HomeBoardMascotMomentType,
} from "@/components/mascot/HomeBoardMascotMoment";

const DEBUG_CELEBRATION_MS = 3900;

export function DebugCelebrationControls() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [activeMoment, setActiveMoment] =
    useState<HomeBoardMascotMomentType | null>(null);
  const [runId, setRunId] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const syncEnabled = () => {
      const params = new URLSearchParams(window.location.search);
      setIsEnabled(
        window.location.pathname === "/wall" &&
          params.get("debugCelebration") === "1",
      );
    };

    syncEnabled();
    window.addEventListener("popstate", syncEnabled);
    window.addEventListener("hashchange", syncEnabled);
    return () => {
      window.removeEventListener("popstate", syncEnabled);
      window.removeEventListener("hashchange", syncEnabled);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const play = useCallback((moment: HomeBoardMascotMomentType) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setActiveMoment(null);
    setRunId((current) => current + 1);
    window.requestAnimationFrame(() => {
      setActiveMoment(moment);
      timerRef.current = window.setTimeout(() => {
        setActiveMoment(null);
        timerRef.current = null;
      }, DEBUG_CELEBRATION_MS);
    });
  }, []);

  const title = useMemo(() => {
    if (activeMoment === "proudClap") return "Dagens uppdrag är klart";
    return "Stjärnklart!";
  }, [activeMoment]);

  if (!isEnabled) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[120] flex max-w-[calc(100vw-2rem)] flex-wrap justify-end gap-2 rounded-[1.25rem] border border-white/70 bg-white/86 p-2 shadow-[0_18px_55px_rgba(84,59,34,0.24)] backdrop-blur">
        <button
          className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white shadow-[0_10px_24px_rgba(28,25,23,0.18)] active:scale-95"
          onClick={() => play("thumbsUp")}
          type="button"
        >
          Testa tumme upp
        </button>
        <button
          className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-stone-950 shadow-[0_10px_24px_rgba(245,158,11,0.22)] active:scale-95"
          onClick={() => play("proudClap")}
          type="button"
        >
          Testa klapp
        </button>
      </div>

      {activeMoment ? (
        <div
          aria-hidden
          className="fixed inset-0 z-[110] grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(251,191,36,0.24),transparent_34rem),radial-gradient(circle_at_62%_72%,rgba(52,211,153,0.18),transparent_26rem)] pointer-events-none"
        >
          <div key={`${activeMoment}-${runId}`} className="grid justify-items-center gap-5">
            <HomeBoardMascotMoment moment={activeMoment} />
            <div className="max-w-xl text-center opacity-0 animate-[debug-celebration-copy_3900ms_var(--ease-out)_both]">
              <p className="text-5xl font-black tracking-tight text-stone-950 drop-shadow-[0_10px_42px_rgba(255,250,230,0.85)] lg:text-7xl">
                {title}
              </p>
              <p className="mt-3 text-xl font-bold text-stone-600">
                Temporärt testläge för koalans animation.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes debug-celebration-copy {
          0%, 24% {
            opacity: 0;
            transform: translateY(1rem) scale(0.96);
          }
          38%, 78% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-0.35rem) scale(0.99);
          }
        }
      `}</style>
    </>
  );
}
