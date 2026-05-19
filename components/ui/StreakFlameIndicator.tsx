"use client";

export function StreakFlameIndicator({ streak, animateIntro = false, showLabel = false }: { streak: number; animateIntro?: boolean; showLabel?: boolean }) {
  if (streak < 2) return null;

  return (
    <span
      className={`relative inline-flex flex-col items-end px-1 py-0.5 text-amber-100 ${animateIntro ? "streak-flame-intro" : ""}`}
      style={{
        background:
          "radial-gradient(circle at 68% 36%, rgba(251,191,36,0.22), rgba(251,146,60,0.12) 42%, rgba(0,0,0,0) 78%)",
        textShadow: "0 0 10px rgba(251,146,60,0.2)",
      }}
    >
      {showLabel ? (
        <span className="text-[0.54rem] font-black leading-none tracking-[0.22em] text-amber-200/90">STREAK</span>
      ) : null}
      <span className="inline-flex items-center gap-1 text-sm font-black text-amber-50">
        <span aria-hidden="true" className="text-[1.08em]">🔥</span>
        <span>{streak}</span>
      </span>
    </span>
  );
}
