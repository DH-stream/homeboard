"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayAgenda } from "@/components/calendar/TodayAgenda";
import { WeekPreview } from "@/components/calendar/WeekPreview";
import { WallPairingCard } from "@/components/pairing/WallPairingCard";
import { WallShell } from "@/components/layout/WallShell";
import { MemberBadge } from "@/components/members/MemberBadge";
import { TaskList } from "@/components/tasks/TaskList";
import { WallQuickTaskButton } from "@/components/wall/WallQuickTaskButton";
import { WallQuickTaskCreator } from "@/components/wall/WallQuickTaskCreator";
import { StreakBalloons } from "@/components/wall/StreakBalloons";
import { ActionToast } from "@/components/ui/ActionToast";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StreakFlameIndicator } from "@/components/ui/StreakFlameIndicator";
import { isCloudConfigured } from "@/lib/cloud/config";
import { signOutParentLocally } from "@/lib/auth/parentAuth";
import { getPersistedCloudDeviceId } from "@/lib/devices/deviceIdentity";
import { resetThisDeviceLocally } from "@/lib/devices/resetLocalDevice";
import {
  enableLocalOnlyMode,
  getLocalSelectedHouseholdId,
  isLocalOnlyModeEnabled,
  LOCAL_ONLY_MODE_CHANGED_EVENT,
  saveSelectedHouseholdId,
} from "@/lib/households/selection";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { useHousehold, useMembers } from "@/lib/hooks/useMembers";
import {
  consumePendingFirstRunReveal,
  hasPendingFirstRunReveal,
} from "@/lib/firstRunReveal";
import { useTasks } from "@/lib/hooks/useTasks";
import {
  readWallTaskCreatorMode,
  WALL_TASK_CREATOR_MODE_CHANGE_EVENT,
  type WallTaskCreatorMode,
} from "@/lib/wallPreferences";
import { resetDeviceStartView, saveDeviceStartView } from "@/lib/devicePreferences";
import { rememberStableRoute } from "@/lib/navigation/stableRoutes";
import { getLocale, useLanguage } from "@/lib/i18n";
import { formatShortDate } from "@/lib/utils/date";
import {
  getLocalDateKey,
  hasSeenStreakFlameToday,
  markStreakFlameSeenToday,
} from "@/lib/tasks/streak";
import { createStreakService } from "@/lib/services/streakService";
import { createDeviceService } from "@/lib/services/deviceService";
import {
  shouldShowInRemainingTasks,
  shouldShowTodayTask,
} from "@/lib/tasks/visibility";
import { deviceRepository } from "@/lib/repositories/deviceRepository";
import type { TaskInstance } from "@/types";

const QUICK_CREATOR_CLOSE_MS = 240;
const QUICK_CREATOR_REDUCED_MOTION_CLOSE_MS = 20;
const MAX_WALL_STREAK_PREVIEW = 24;
const DEVICE_VALIDATION_INTERVAL_MS = 20_000;
const deviceService = createDeviceService(deviceRepository);

function getFirstCreatedTaskId(created: unknown) {
  if (!Array.isArray(created)) return null;
  const firstTask = created.find((task): task is TaskInstance =>
    Boolean(task && typeof task === "object" && "id" in task),
  );
  return firstTask?.id ?? null;
}

function getWallStreakPreviewOverride() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("streakPreview");
  if (!raw) return null;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return Math.min(parsed, MAX_WALL_STREAK_PREVIEW);
}

export default function WallPage() {
  const router = useRouter();
  const [isSetupMode, setIsSetupMode] = useState(false);
  const { getCompletionEncouragement, language, t } = useLanguage();
  const locale = getLocale(language);
  const { householdId } = useResolvedHouseholdId();
  const { household } = useHousehold();
  const { members } = useMembers();
  const { events, todayEvents } = useCalendarEvents();
  const { tasks, createTask, setTaskCompleted } = useTasks();
  const [now, setNow] = useState(new Date());
  const [completionFeedback, setCompletionFeedback] = useState<{
    taskId: string;
    message: string;
  } | null>(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<
    string | null
  >(null);
  const [recentlyCreatedTaskId, setRecentlyCreatedTaskId] = useState<
    string | null
  >(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isFirstRunRevealActive] = useState(() =>
    hasPendingFirstRunReveal("wall"),
  );
  const [wallTaskCreatorMode, setWallTaskCreatorMode] =
    useState<WallTaskCreatorMode | null>(null);
  const [isQuickCreatorOpen, setQuickCreatorOpen] = useState(false);
  const [isQuickCreatorMounted, setQuickCreatorMounted] = useState(false);
  const [useLocalWall, setUseLocalWall] = useState(() =>
    isLocalOnlyModeEnabled(),
  );
  const [streakPreviewOverride] = useState(() =>
    getWallStreakPreviewOverride(),
  );
  const quickCreatorTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsSetupMode(new URLSearchParams(window.location.search).get("setup") === "1");
  }, []);

  useEffect(() => {
    const refreshLocalWallMode = () => setUseLocalWall(isLocalOnlyModeEnabled());
    refreshLocalWallMode();
    window.addEventListener(LOCAL_ONLY_MODE_CHANGED_EVENT, refreshLocalWallMode);
    window.addEventListener("storage", refreshLocalWallMode);
    return () => {
      window.removeEventListener(LOCAL_ONLY_MODE_CHANGED_EVENT, refreshLocalWallMode);
      window.removeEventListener("storage", refreshLocalWallMode);
    };
  }, []);

  const todayTasks = useMemo(
    () => tasks.filter((task) => shouldShowTodayTask(task, now)),
    [now, tasks],
  );
  const remainingTodayTasks = useMemo(
    () => todayTasks.filter((task) => shouldShowInRemainingTasks(task, now)),
    [now, todayTasks],
  );
  const filteredTodayTasks = useMemo(() => {
    if (!selectedMemberId) return remainingTodayTasks;
    return remainingTodayTasks.filter(
      (task) => task.assignedToMemberId === selectedMemberId,
    );
  }, [selectedMemberId, remainingTodayTasks]);
  const stats = useMemo(() => {
    const completed = todayTasks.filter((task) => task.completedAt).length;
    return {
      completed,
      total: todayTasks.length,
      remaining: todayTasks.length - completed,
    };
  }, [todayTasks]);

  const allVisibleTasksDone =
    todayTasks.length > 0 && filteredTodayTasks.length === 0;
  const [streak, setStreak] = useState(0);
  const displayStreak = streakPreviewOverride ?? streak;
  const [showStreakIntro, setShowStreakIntro] = useState(false);
  const streakService = useMemo(() => createStreakService(), []);

  useEffect(() => {
    if (!householdId) {
      setStreak(0);
      return;
    }

    let cancelled = false;

    const syncStreak = async () => {
      try {
        await streakService.maybeMarkTodayComplete(householdId, todayTasks);
        const nextStreak = await streakService.getHouseholdTaskStreak(
          householdId,
          now,
        );
        if (!cancelled) setStreak(nextStreak);
      } catch (error) {
        console.warn("Unable to sync household streak", error);
      }
    };

    syncStreak();

    return () => {
      cancelled = true;
    };
  }, [householdId, now, streakService, todayTasks]);

  useEffect(() => {
    if (!householdId || displayStreak < 2) {
      setShowStreakIntro(false);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dateKey = getLocalDateKey(now);
    if (hasSeenStreakFlameToday(householdId, dateKey)) return;

    setShowStreakIntro(true);
    markStreakFlameSeenToday(householdId, dateKey);
    const timer = window.setTimeout(() => setShowStreakIntro(false), 1800);
    return () => window.clearTimeout(timer);
  }, [householdId, now, displayStreak]);

  const allDoneTitle =
    language === "sv"
      ? "Allt är klart för idag."
      : "Everything is done for today.";
  const allDoneBody =
    language === "sv"
      ? "Klara uppgifter finns kvar i mobilvyn under Klart."
      : "Completed tasks remain available in the mobile Done view.";
  const todayTitle = language === "sv" ? "Idag" : "Today";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (householdId || useLocalWall) consumePendingFirstRunReveal("wall");
  }, [householdId, useLocalWall]);

  useEffect(() => {
    if (useLocalWall) return;

    let cancelled = false;

    const validateCurrentDevice = async () => {
      const persistedDeviceId = getPersistedCloudDeviceId();
      if (!persistedDeviceId) return;

      try {
        const selectedHouseholdId = getLocalSelectedHouseholdId();
        const cloudDevice = await deviceService.getDevice(persistedDeviceId);
        const wasUnlinked =
          !cloudDevice ||
          !cloudDevice.householdId ||
          (selectedHouseholdId ? cloudDevice.householdId !== selectedHouseholdId : true);

        if (!wasUnlinked || cancelled) return;

        await resetThisDeviceLocally();
        if (!cancelled) router.replace("/?choose=1");
      } catch (error) {
        console.warn("Unable to validate wall device link status", error);
      }
    };

    void validateCurrentDevice();
    const interval = window.setInterval(() => void validateCurrentDevice(), DEVICE_VALIDATION_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void validateCurrentDevice();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router, useLocalWall]);
  const closeQuickCreator = useCallback(() => {
    if (quickCreatorTimerRef.current)
      window.clearTimeout(quickCreatorTimerRef.current);

    setQuickCreatorOpen(false);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    quickCreatorTimerRef.current = window.setTimeout(
      () => {
        setQuickCreatorMounted(false);
        quickCreatorTimerRef.current = null;
      },
      prefersReducedMotion
        ? QUICK_CREATOR_REDUCED_MOTION_CLOSE_MS
        : QUICK_CREATOR_CLOSE_MS,
    );
  }, []);

  const openQuickCreator = useCallback(() => {
    if (quickCreatorTimerRef.current)
      window.clearTimeout(quickCreatorTimerRef.current);

    setQuickCreatorMounted(true);
    window.requestAnimationFrame(() => setQuickCreatorOpen(true));
  }, []);

  const toggleQuickCreator = useCallback(() => {
    if (isQuickCreatorOpen) {
      closeQuickCreator();
      return;
    }

    openQuickCreator();
  }, [closeQuickCreator, isQuickCreatorOpen, openQuickCreator]);

  useEffect(() => {
    setWallTaskCreatorMode(readWallTaskCreatorMode());

    const handleChange = () =>
      setWallTaskCreatorMode(readWallTaskCreatorMode());
    window.addEventListener(WALL_TASK_CREATOR_MODE_CHANGE_EVENT, handleChange);
    return () =>
      window.removeEventListener(
        WALL_TASK_CREATOR_MODE_CHANGE_EVENT,
        handleChange,
      );
  }, []);

  useEffect(() => {
    if (wallTaskCreatorMode !== "docked" && isQuickCreatorMounted)
      closeQuickCreator();
  }, [closeQuickCreator, isQuickCreatorMounted, wallTaskCreatorMode]);

  useEffect(() => {
    return () => {
      if (quickCreatorTimerRef.current)
        window.clearTimeout(quickCreatorTimerRef.current);
    };
  }, []);

  const handleTaskCreated = useCallback(
    (created: unknown) => {
      const createdTaskId = getFirstCreatedTaskId(created);
      setCreateSuccessMessage(t("taskAdded"));
      setRecentlyCreatedTaskId(createdTaskId);
      window.setTimeout(() => {
        setRecentlyCreatedTaskId((current) =>
          current === createdTaskId ? null : current,
        );
      }, 1800);
    },
    [setCreateSuccessMessage, setRecentlyCreatedTaskId, t],
  );

  const finishPairing = useCallback((nextHouseholdId: string) => {
    void signOutParentLocally();
    saveSelectedHouseholdId(nextHouseholdId);
    saveDeviceStartView({ mode: "wall", route: "/wall" });
  }, []);


  useEffect(() => {
    if (isSetupMode) return;
    if (typeof window === "undefined") return;
    const canUseStableWall = Boolean(householdId) || useLocalWall || !isCloudConfigured();
    if (canUseStableWall) rememberStableRoute("/wall");
  }, [householdId, isSetupMode, useLocalWall]);

  if (!householdId && !useLocalWall && isCloudConfigured()) {
    return (
      <WallPairingCard
        onPaired={finishPairing}
        onBack={isSetupMode ? () => { resetDeviceStartView(); router.replace("/?choose=1"); } : undefined}
        onUseLocal={() => {
          void signOutParentLocally();
          saveDeviceStartView({ mode: "wall", route: "/wall" });
          enableLocalOnlyMode();
          setUseLocalWall(true);
        }}
      />
    );
  }

  async function toggleTask(task: TaskInstance) {
    const willComplete = !task.completedAt;
    try {
      await setTaskCompleted(task, willComplete, task.assignedToMemberId);
    } catch {
      return;
    }

    if (willComplete) {
      const message = getCompletionEncouragement(completionFeedback?.message);
      setCompletionFeedback({ taskId: task.id, message });
      window.setTimeout(
        () =>
          setCompletionFeedback((current) =>
            current?.taskId === task.id ? null : current,
          ),
        1400,
      );
    }
  }

  return (
    <WallShell revealActive={isFirstRunRevealActive}>
      <div className="relative flex flex-1 flex-col">
        <StreakBalloons householdId={householdId} streak={displayStreak} />
        <div className="relative z-10 flex flex-1 flex-col">
          <header
            className={`grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end ${isFirstRunRevealActive ? "reveal-item reveal-item--header reveal-stagger-3" : ""}`}
          >
            <div className="min-w-0">
              <p className="text-lg font-black uppercase tracking-[0.24em] text-amber-700">
                {household?.name ?? "HomeBoard"}
              </p>
              <h1 className="mt-2 text-6xl font-black tracking-tight text-stone-950 lg:text-8xl">
                {formatShortDate(now, locale)}
              </h1>
              <p className="mt-3 text-4xl font-black text-stone-600">
                {new Intl.DateTimeFormat(locale, {
                  hour: "numeric",
                  minute: "2-digit",
                }).format(now)}
              </p>
            </div>
            <div
              className={`min-w-0 rounded-[2rem] bg-stone-950 p-5 text-white shadow-[0_20px_70px_rgba(28,25,23,0.24)] transition-[box-shadow,transform] duration-200 ease-[var(--ease-out)] lg:min-w-80 ${completionFeedback ? "shadow-emerald-500/20" : ""} ${isFirstRunRevealActive ? "reveal-item reveal-item--card reveal-stagger-4" : ""}`}
            >
              <p className="min-h-5 text-sm font-bold uppercase tracking-[0.18em] text-amber-200 flex items-center justify-between gap-2">
                <span className="truncate">
                  {completionFeedback?.message ?? t("todaysProgress")}
                </span>
                <StreakFlameIndicator
                  streak={displayStreak}
                  animateIntro={showStreakIntro}
                  showLabel
                />
              </p>
              <p className="mt-2 text-5xl font-black">
                {stats.completed}/{stats.total}
              </p>
              <p className="mt-1 min-h-6 truncate font-semibold text-white/70">
                {t("progressComplete")} · {stats.remaining} {t("remaining")}
              </p>
            </div>
          </header>

          <div
            className={`mt-5 flex flex-wrap gap-2 ${isFirstRunRevealActive ? "reveal-item reveal-item--list reveal-stagger-5" : ""}`}
          >
            {members.map((member) => (
              <MemberBadge
                isSelected={selectedMemberId === member.id}
                key={member.id}
                member={member}
                onClick={() =>
                  setSelectedMemberId((current) =>
                    current === member.id ? null : member.id,
                  )
                }
              />
            ))}
          </div>

          <div className="mt-6 grid flex-1 min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
            <section
              className={`flex min-h-0 flex-col rounded-[2.25rem] bg-white/82 p-5 shadow-[0_24px_80px_rgba(120,93,58,0.18)] backdrop-blur ${isFirstRunRevealActive ? "reveal-item reveal-item--card reveal-stagger-6" : ""}`}
            >
              <div className="flex items-center justify-between gap-4">
                <SectionHeader eyebrow={t("tasks")} title={todayTitle} />
                <WallQuickTaskButton
                  isOpen={isQuickCreatorOpen}
                  onToggle={toggleQuickCreator}
                />
              </div>
              {wallTaskCreatorMode === "docked" ? (
                <WallQuickTaskCreator
                  members={members}
                  onCreateTask={createTask}
                  onCreated={handleTaskCreated}
                  variant="panel"
                />
              ) : null}
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                {allVisibleTasksDone ? (
                  <EmptyState title={allDoneTitle}>{allDoneBody}</EmptyState>
                ) : (
                  <TaskList
                    animationKey="wall-tasks"
                    grouped
                    members={members}
                    onToggle={toggleTask}
                    recentlyCreatedId={recentlyCreatedTaskId}
                    roomy
                    tasks={filteredTodayTasks}
                  />
                )}
              </div>
            </section>

            <aside className="grid min-h-0 gap-5 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
              <TodayAgenda events={todayEvents} />
              <WeekPreview events={events} variant="wall" />
            </aside>
          </div>
        </div>
      </div>
    </WallShell>
  );
}
