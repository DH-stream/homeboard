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
  size: string;
};

const MAX_BALLOONS = 12;
const MIN_STREAK = 2;
const STORAGE_PREFIX = "homeboard.streakBalloonsSeen.";

const BALLOON_POSITIONS: BalloonPosition[] = [
  { top: "4%", left: "-2%", size: "lg" },
  { top: "10%", right: "-2%", size: "xl" },
  { top: "26%", left: "-4%", size: "md" },
  { top: "30%", right: "4%", size: "lg" },
  { top: "2%", left: "32%", size: "sm" },
  { top: "48%", right: "10%", size: "xl" },
  { top: "56%", left: "18%", size: "lg" },
  { top: "20%", left: "56%", size: "md" },
  { top: "44%", left: "38%", size: "md" },
  { top: "64%", right: "28%", size: "lg" },
  { top: "68%", left: "-1%", size: "xl" },
  { top: "10%", right: "26%", size: "sm" },
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
            data-size={position.size}
            style={{
              ...position,
              ["--balloon-delay" as string]: `${index * 40}ms`,
              ["--balloon-color" as string]: tone,
              ["--balloon-size" as string]: position.size,
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
