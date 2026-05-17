"use client";

import { useLanguage } from "@/lib/i18n";

export function WallQuickTaskButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { t } = useLanguage();

  return (
    <button
      aria-expanded={isOpen}
      className={`pressable flex min-h-11 items-center gap-2 rounded-full border border-white/80 bg-amber-100/86 px-3 py-2 text-sm font-black text-stone-950 shadow-sm backdrop-blur-xl hover:bg-amber-200/90 sm:px-4 ${isOpen ? "shadow-[0_10px_28px_rgba(245,158,11,0.2)] ring-2 ring-amber-200/70" : ""}`}
      onClick={onToggle}
      type="button"
    >
      <span className="grid size-7 place-items-center rounded-full bg-stone-950 text-lg leading-none text-amber-200">+</span>
      <span>{t("wallQuickTaskLabel")}</span>
    </button>
  );
}
