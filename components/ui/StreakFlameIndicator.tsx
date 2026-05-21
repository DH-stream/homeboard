"use client";

type StreakFlameIndicatorVariant = "default" | "mobileBoost";

export function StreakFlameIndicator({
  streak,
  animateIntro = false,
  showLabel = false,
  variant = "default",
}: {
  streak: number;
  animateIntro?: boolean;
  showLabel?: boolean;
  variant?: StreakFlameIndicatorVariant;
}) {
  if (streak < 2) return null;

  const boosted = variant === "mobileBoost";
  const labelShadow = boosted ? " [text-shadow:0_1px_2px_rgba(0,0,0,0.22),0_0_8px_rgba(251,146,60,0.28)]" : "";
  const valueShadow = boosted
    ? " [text-shadow:0_1px_2px_rgba(0,0,0,0.38),0_0_8px_rgba(0,0,0,0.14),0_0_12px_rgba(251,146,60,0.26)]"
    : " [text-shadow:0_0_12px_rgba(251,146,60,0.24)]";
  const glowClass = boosted
    ? "bg-[radial-gradient(circle,rgba(251,146,60,0.22)_0%,rgba(251,146,60,0.09)_45%,transparent_80%)]"
    : "bg-[radial-gradient(circle,rgba(251,146,60,0.2)_0%,rgba(251,146,60,0.08)_45%,transparent_80%)]";
  const flameShadow = boosted ? " drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]" : "";
  const numberShadow = boosted ? " text-amber-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : "";

  return (
    <span className={`inline-flex flex-col items-end px-0.5 py-0.5 ${animateIntro ? "streak-flame-intro" : ""}`}>
      {showLabel ? (
        <span className={`text-[0.54rem] font-black leading-none tracking-[0.22em] text-amber-200/92${labelShadow}`}>STREAK</span>
      ) : null}
      <span className={`relative inline-flex items-center gap-1 text-sm font-black text-amber-50${valueShadow}`}>
        <span aria-hidden className={`pointer-events-none absolute left-1/2 top-1/2 h-6 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${glowClass} blur-md`} />
        <span aria-hidden="true" className={`relative text-[1.08em]${flameShadow}`}>🔥</span>
        <span className={`relative${numberShadow}`}>{streak}</span>
      </span>
    </span>
  );
}
