"use client";

import { useEffect, useMemo, useState } from "react";

type StreakBalloonsProps = {
  householdId: string | null;
  streak: number;
};

type BalloonPosition = {
  top: string;
  left?: string;
  right?: string;
};

const MAX_BALLOONS = 12;
const MIN_STREAK = 2;
const STORAGE_PREFIX = "homeboard.streakBalloonsSeen.";

const BALLOON_POSITIONS: BalloonPosition[] = [
  { top: "10%", left: "10%" },
  { top: "16%", right: "12%" },
  { top: "30%", left: "6%" },
  { top: "36%", right: "7%" },
  { top: "8%", left: "38%" },
  { top: "52%", right: "18%" },
  { top: "58%", left: "24%" },
  { top: "22%", left: "62%" },
  { top: "46%", left: "44%" },
  { top: "64%", right: "36%" },
  { top: "70%", left: "8%" },
  { top: "12%", right: "36%" },
];

const BALLOON_TONES = [
  "var(--balloon-amber)",
  "var(--balloon-coral)",
  "var(--balloon-cream)",
  "var(--balloon-blue)",
  "var(--balloon-sage)",
  "var(--balloon-peach)",
];

function getStorageKey(householdId: string | null) {
  return `${STORAGE_PREFIX}${householdId ?? "local-preview"}`;
}

export function StreakBalloons({ householdId, streak }: StreakBalloonsProps) {
  const visibleBalloons = useMemo(() => {
    if (streak < MIN_STREAK) return 0;
    return Math.min(streak, MAX_BALLOONS);
  }, [streak]);

  const [seenCount, setSeenCount] = useState(visibleBalloons);

  useEffect(() => {
    const key = getStorageKey(householdId);
    const storedRaw = window.localStorage.getItem(key);
    const storedCount = storedRaw ? Number.parseInt(storedRaw, 10) : 0;
    if (Number.isFinite(storedCount) && storedCount > 0) {
      setSeenCount(Math.min(storedCount, MAX_BALLOONS));
    }
  }, [householdId]);

  useEffect(() => {
    if (visibleBalloons <= seenCount) return;

    const key = getStorageKey(householdId);
    setSeenCount(visibleBalloons);
    window.localStorage.setItem(key, String(visibleBalloons));
  }, [householdId, seenCount, visibleBalloons]);

  if (visibleBalloons < MIN_STREAK) return null;

  return (
    <div aria-hidden className="streak-balloons-layer">
      {Array.from({ length: visibleBalloons }, (_, index) => {
        const position = BALLOON_POSITIONS[index];
        const tone = BALLOON_TONES[index % BALLOON_TONES.length];
        const shouldEnter = index >= seenCount;

        return (
          <div
            className={`streak-balloon ${shouldEnter ? "streak-balloon--enter" : ""}`}
            key={`streak-balloon-${index}`}
            style={{
              ...position,
              ["--balloon-delay" as string]: `${index * 40}ms`,
              ["--balloon-color" as string]: tone,
            }}
          >
            <span className="streak-balloon__body" />
            <span className="streak-balloon__knot" />
            <span className="streak-balloon__string" />
          </div>
        );
      })}
    </div>
  );
}
