"use client";

export function StreakFlameIndicator({ streak, animateIntro = false }: { streak: number; animateIntro?: boolean }) {
  if (streak < 2) return null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100/78 px-2 py-0.5 text-amber-900 shadow-[0_0_0_1px_rgba(251,191,36,0.24),0_0_16px_rgba(251,146,60,0.2)] ${animateIntro ? "streak-flame-intro" : ""}`}>
      <span aria-hidden="true" className="text-[1.05em]">🔥</span>
      <span className="text-xs font-black">{streak}</span>
    </span>
  );
}
