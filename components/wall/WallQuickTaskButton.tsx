"use client";

import { useState } from "react";
import { WallQuickTaskCreator } from "@/components/wall/WallQuickTaskCreator";
import { useLanguage } from "@/lib/i18n";
import type { CreateTaskInput, HouseholdMember } from "@/types";

export function WallQuickTaskButton({ members, onCreateTask }: { members: HouseholdMember[]; onCreateTask: (input: CreateTaskInput) => Promise<unknown> }) {
  const { t } = useLanguage();
  const [isOpen, setOpen] = useState(false);

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-30 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-3 lg:bottom-8 lg:right-8">
      {isOpen ? <WallQuickTaskCreator members={members} onCancel={() => setOpen(false)} onCreateTask={onCreateTask} variant="popover" /> : null}
      <button
        aria-expanded={isOpen}
        className="pressable flex min-h-14 items-center gap-2 rounded-full border border-white/80 bg-amber-100/86 px-4 py-3 font-black text-stone-950 shadow-[0_18px_55px_rgba(84,59,34,0.22)] backdrop-blur-xl hover:bg-amber-200/90 sm:px-5"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="grid size-8 place-items-center rounded-full bg-stone-950 text-xl leading-none text-amber-200">+</span>
        <span className="hidden sm:inline">{t("wallQuickTaskLabel")}</span>
      </button>
    </div>
  );
}
