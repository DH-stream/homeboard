"use client";

export function StreakFlameIndicator({ streak, animateIntro = false }: { streak: number; animateIntro?: boolean }) {
  if (streak < 2) return null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2 py-0.5 text-amber-900 ${animateIntro ? "streak-flame-intro" : ""}`}>
      <span aria-hidden="true" className="text-[1.05em]">🔥</span>
      <span className="text-xs font-black">{streak}</span>
    </span>
  );
}
