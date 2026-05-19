"use client";

export function StreakFlameIndicator({ streak, animateIntro = false, showLabel = false }: { streak: number; animateIntro?: boolean; showLabel?: boolean }) {
  if (streak < 2) return null;

  return (
    <span className={`inline-flex flex-col rounded-full bg-amber-100/78 px-2 py-0.5 text-amber-900 shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_0_14px_rgba(251,146,60,0.18)] ${animateIntro ? "streak-flame-intro" : ""}`}>
      {showLabel ? <span className="text-[0.54rem] font-black leading-none tracking-[0.22em] text-amber-700/90">STREAK</span> : null}
      <span className="inline-flex items-center gap-1">
        <span aria-hidden="true" className="text-[1.05em]">🔥</span>
        <span className="text-xs font-black">{streak}</span>
      </span>
    </span>
  );
}
