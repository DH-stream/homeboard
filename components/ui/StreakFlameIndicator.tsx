"use client";

export function StreakFlameIndicator({ streak, animateIntro = false, showLabel = false }: { streak: number; animateIntro?: boolean; showLabel?: boolean }) {
  if (streak < 2) return null;

  return (
    <span className={`inline-flex flex-col items-end px-0.5 py-0.5 ${animateIntro ? "streak-flame-intro" : ""}`}>
      {showLabel ? (
        <span className="text-[0.54rem] font-black leading-none tracking-[0.22em] text-amber-200/92 [text-shadow:0_1px_2px_rgba(0,0,0,0.22),0_0_8px_rgba(251,146,60,0.28)]">STREAK</span>
      ) : null}
      <span className="relative inline-flex items-center gap-1 text-sm font-black text-amber-50 [text-shadow:0_1px_2px_rgba(0,0,0,0.38),0_0_8px_rgba(0,0,0,0.14),0_0_12px_rgba(251,146,60,0.26)]">
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.22)_0%,rgba(251,146,60,0.09)_45%,transparent_80%)] blur-md" />
        <span aria-hidden="true" className="relative text-[1.08em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]">🔥</span>
        <span className="relative text-amber-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{streak}</span>
      </span>
    </span>
  );
}
