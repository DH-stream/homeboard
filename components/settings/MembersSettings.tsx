"use client";

import { FormEvent, useEffect, useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useLanguage, type Language } from "@/lib/i18n";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { createHouseholdService } from "@/lib/services/householdService";
import type { HouseholdMember } from "@/types";

const service = createHouseholdService(householdRepository);
const colors = ["#f97316", "#f59e0b", "#14b8a6", "#60a5fa", "#a78bfa", "#f472b6"];

const copy: Record<Language, Record<string, string>> = {
  en: {
    add: "Add member",
    child: "Child",
    adults: "Adult",
    empty: "No members added yet.",
    needsHome: "Choose a cloud home first to manage household members.",
    name: "Name",
    role: "Role",
    members: "Members",
  },
  sv: {
    add: "Lägg till medlem",
    child: "Barn",
    adults: "Vuxen",
    empty: "Inga medlemmar tillagda än.",
    needsHome: "Välj ett molnhem först för att hantera hushållets medlemmar.",
    name: "Namn",
    role: "Roll",
    members: "Medlemmar",
  },
};

export function MembersSettings() {
  const { householdId } = useActiveHousehold();
  const { language } = useLanguage();
  const t = copy[language];
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"adult" | "child">("adult");
  const [color, setColor] = useState(colors[0]);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    if (!householdId) {
      setMembers([]);
      return;
    }

    service.listHouseholdMembers(householdId).then(setMembers).catch(() => setMembers([]));
  }, [householdId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!householdId || !name.trim()) return;
    setSaving(true);
    try {
      await service.createHouseholdMembers(householdId, [{ displayName: name.trim(), color, role }]);
      setName("");
      setRole("adult");
      setColor(colors[0]);
      const next = await service.listHouseholdMembers(householdId);
      setMembers(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard status={householdId ? `${members.length}` : "—"} title={t.members}>
      {!householdId ? (
        <p>{t.needsHome}</p>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-2">
            {members.map((member) => (
              <li className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2" key={member.id}>
                <div className="flex items-center gap-3">
                  <span className="size-3 rounded-full" style={{ backgroundColor: member.color }} />
                  <span className="font-black text-stone-900">{member.displayName}</span>
                </div>
                <span className="text-sm font-bold text-stone-500">{member.role === "adult" ? t.adults : t.child}</span>
              </li>
            ))}
          </ul>
          {members.length === 0 ? <p className="text-sm font-bold text-stone-500">{t.empty}</p> : null}
          <form className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3" onSubmit={onSubmit}>
            <input className="min-h-11 w-full rounded-xl border border-stone-200 px-3 font-semibold" onChange={(e) => setName(e.target.value)} placeholder={t.name} required value={name} />
            <div className="grid grid-cols-2 gap-2">
              <select className="min-h-11 rounded-xl border border-stone-200 px-3 font-semibold" onChange={(e) => setRole(e.target.value as "adult" | "child")} value={role}>
                <option value="adult">{t.adults}</option>
                <option value="child">{t.child}</option>
              </select>
              <div className="flex items-center gap-2">
                {colors.map((swatch) => (
                  <button aria-label={swatch} className={`size-7 rounded-full border-2 ${color === swatch ? "border-stone-900" : "border-transparent"}`} key={swatch} onClick={() => setColor(swatch)} style={{ backgroundColor: swatch }} type="button" />
                ))}
              </div>
            </div>
            <button className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-2 text-sm font-black text-white" disabled={isSaving} type="submit">
              {t.add}
            </button>
          </form>
        </div>
      )}
    </SettingsCard>
  );
}
