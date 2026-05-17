"use client";

import { useEffect, useState } from "react";
import {
  readWallTaskCreatorMode,
  saveWallTaskCreatorMode,
  WALL_TASK_CREATOR_MODE_CHANGE_EVENT,
  type WallTaskCreatorMode,
} from "@/lib/wallPreferences";
import { useLanguage } from "@/lib/i18n";
import { SettingsCard } from "./SettingsCard";

const WALL_TASK_CREATOR_OPTIONS: WallTaskCreatorMode[] = ["off", "docked", "panel"];

function getModeLabel(mode: WallTaskCreatorMode, t: ReturnType<typeof useLanguage>["t"]) {
  if (mode === "off") return t("wallTaskCreatorModeOff");
  if (mode === "panel") return t("wallTaskCreatorModePanel");
  return t("wallTaskCreatorModeDocked");
}

function getModeDescription(mode: WallTaskCreatorMode, t: ReturnType<typeof useLanguage>["t"]) {
  if (mode === "off") return t("wallTaskCreatorModeOffCopy");
  if (mode === "panel") return t("wallTaskCreatorModePanelCopy");
  return t("wallTaskCreatorModeDockedCopy");
}

export function WallTaskCreatorSettings() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<WallTaskCreatorMode>("docked");

  useEffect(() => {
    setMode(readWallTaskCreatorMode());

    const handleChange = () => setMode(readWallTaskCreatorMode());
    window.addEventListener(WALL_TASK_CREATOR_MODE_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(WALL_TASK_CREATOR_MODE_CHANGE_EVENT, handleChange);
  }, []);

  const updateMode = (nextMode: WallTaskCreatorMode) => {
    saveWallTaskCreatorMode(nextMode);
    setMode(nextMode);
  };

  return (
    <SettingsCard status={t("localPreview")} title={t("wallTaskCreatorTitle")}>
      <div className="space-y-4">
        <dl className="rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-stone-500">{t("wallTaskCreatorCurrentMode")}</dt>
            <dd className="text-right font-black text-stone-900">{getModeLabel(mode, t)}</dd>
          </div>
        </dl>

        <div className="grid gap-2">
          {WALL_TASK_CREATOR_OPTIONS.map((option) => {
            const selected = option === mode;
            return (
              <button
                className={`pressable min-h-16 rounded-2xl border p-4 text-left shadow-sm ${selected ? "border-amber-300 bg-amber-50 text-stone-950" : "border-stone-200 bg-white text-stone-700"}`}
                aria-pressed={selected}
                key={option}
                onClick={() => updateMode(option)}
                type="button"
              >
                <span className="block text-sm font-black text-stone-950">{getModeLabel(option, t)}</span>
                <span className="mt-1 block text-sm font-semibold leading-5 text-stone-600">{getModeDescription(option, t)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </SettingsCard>
  );
}
