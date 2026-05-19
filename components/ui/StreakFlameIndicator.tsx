"use client";

export function StreakFlameIndicator({ streak, animateIntro = false, showLabel = false }: { streak: number; animateIntro?: boolean; showLabel?: boolean }) {
  if (streak < 2) return null;

  return (
    <span className={`inline-flex flex-col rounded-full bg-amber-100/85 px-2.5 py-1 text-amber-900 ${animateIntro ? "streak-flame-intro" : ""}`}>
      {showLabel ? <span className="text-[0.58rem] font-black leading-none tracking-[0.22em] text-amber-700/90">STREAK</span> : null}
      <span className="inline-flex items-center gap-1">
        <span aria-hidden="true" className="text-[1.05em]">🔥</span>
        <span className="text-xs font-black">{streak}</span>
      </span>
    </span>
  );
}
