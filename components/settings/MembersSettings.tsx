"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
    adult: "Adult",
    empty: "No members added yet.",
    needsHome: "Choose a cloud home first to manage household members.",
    name: "Name",
    role: "Role",
    members: "Members",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    loadError: "Could not load members.",
    addError: "Could not add member.",
    updateError: "Could not save member changes.",
    lastAdultError: "At least one adult must remain in this home.",
    plannedAdultInvite: "Adult account linking/invite for additional grown-ups is planned next.",
    keepAdultHint: "This person is currently the only adult in this home.",
  },
  sv: {
    add: "Lägg till medlem",
    child: "Barn",
    adult: "Vuxen",
    empty: "Inga medlemmar tillagda än.",
    needsHome: "Välj ett molnhem först för att hantera hushållets medlemmar.",
    name: "Namn",
    role: "Roll",
    members: "Medlemmar",
    edit: "Redigera",
    save: "Spara",
    cancel: "Avbryt",
    loadError: "Kunde inte ladda medlemmar.",
    addError: "Kunde inte lägga till medlem.",
    updateError: "Kunde inte spara ändringen.",
    lastAdultError: "Det måste finnas minst en vuxen i hemmet.",
    plannedAdultInvite: "Koppling/inbjudan för fler vuxna konton planeras härnäst.",
    keepAdultHint: "Den här personen är just nu den enda vuxna i hemmet.",
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
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingRole, setEditingRole] = useState<"adult" | "child">("adult");
  const [editingColor, setEditingColor] = useState(colors[0]);

  const adultCount = useMemo(() => members.filter((member) => member.role === "adult").length, [members]);

  const loadMembers = useCallback(async () => {
    if (!householdId) {
      setMembers([]);
      return;
    }
    try {
      const next = await service.listHouseholdMembers(householdId);
      setMembers(next);
      setError(null);
    } catch {
      setMembers([]);
      setError(t.loadError);
    }
  }, [householdId, t.loadError]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!householdId || !name.trim()) return;
    setSaving(true);
    try {
      setError(null);
      await service.createHouseholdMembers(householdId, [{ displayName: name.trim(), color, role }]);
      setName("");
      setRole("adult");
      setColor(colors[0]);
      await loadMembers();
    } catch {
      setError(t.addError);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(member: HouseholdMember) {
    setEditingId(member.id);
    setEditingName(member.displayName);
    setEditingRole(member.role === "adult" ? "adult" : "child");
    setEditingColor(member.color);
    setError(null);
  }

  async function saveEdit(member: HouseholdMember) {
    if (!editingName.trim()) return;
    if (member.role === "adult" && editingRole === "child" && adultCount <= 1) {
      setError(t.lastAdultError);
      return;
    }

    setSaving(true);
    try {
      await service.updateHouseholdMember(member.id, { displayName: editingName.trim(), role: editingRole, color: editingColor });
      setEditingId(null);
      await loadMembers();
    } catch {
      setError(t.updateError);
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
            {members.map((member) => {
              const isEditing = editingId === member.id;
              return (
                <li className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3" key={member.id}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input className="min-h-10 w-full rounded-xl border border-stone-200 px-3 font-semibold" onChange={(e) => setEditingName(e.target.value)} value={editingName} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="min-h-10 rounded-xl border border-stone-200 px-3 font-semibold" onChange={(e) => setEditingRole(e.target.value as "adult" | "child")} value={editingRole}>
                          <option value="adult">{t.adult}</option>
                          <option disabled={member.role === "adult" && adultCount <= 1} value="child">{t.child}</option>
                        </select>
                        {member.role === "adult" && adultCount <= 1 ? <p className="text-xs font-bold text-stone-500">{t.keepAdultHint}</p> : null}
                        <div className="flex items-center gap-2">
                          {colors.map((swatch) => (
                            <button aria-label={swatch} className={`size-7 rounded-full border-2 ${editingColor === swatch ? "border-stone-900" : "border-transparent"}`} key={swatch} onClick={() => setEditingColor(swatch)} style={{ backgroundColor: swatch }} type="button" />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="pressable min-h-10 rounded-xl bg-stone-950 px-3 text-sm font-black text-white" disabled={isSaving} onClick={() => void saveEdit(member)} type="button">{t.save}</button>
                        <button className="pressable min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-black text-stone-700" onClick={() => setEditingId(null)} type="button">{t.cancel}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="size-3 rounded-full" style={{ backgroundColor: member.color }} />
                        <span className="font-black text-stone-900">{member.displayName}</span>
                        <span className="text-sm font-bold text-stone-500">{member.role === "adult" ? t.adult : t.child}</span>
                      </div>
                      <button className="pressable min-h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700" onClick={() => startEdit(member)} type="button">{t.edit}</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {members.length === 0 ? <p className="text-sm font-bold text-stone-500">{t.empty}</p> : null}
          {members.some((m) => m.role === "adult" && !m.userId) ? <p className="text-xs font-bold text-stone-500">{t.plannedAdultInvite}</p> : null}
          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">{error}</p> : null}
          <form className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3" onSubmit={onSubmit}>
            <input className="min-h-11 w-full rounded-xl border border-stone-200 px-3 font-semibold" onChange={(e) => setName(e.target.value)} placeholder={t.name} required value={name} />
            <div className="grid grid-cols-2 gap-2">
              <select className="min-h-11 rounded-xl border border-stone-200 px-3 font-semibold" onChange={(e) => setRole(e.target.value as "adult" | "child")} value={role}>
                <option value="adult">{t.adult}</option>
                <option value="child">{t.child}</option>
              </select>
              <div className="flex items-center gap-2">
                {colors.map((swatch) => (
                  <button aria-label={swatch} className={`size-7 rounded-full border-2 ${color === swatch ? "border-stone-900" : "border-transparent"}`} key={swatch} onClick={() => setColor(swatch)} style={{ backgroundColor: swatch }} type="button" />
                ))}
              </div>
            </div>
            <button className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-2 text-sm font-black text-white" disabled={isSaving} type="submit">{t.add}</button>
          </form>
        </div>
      )}
    </SettingsCard>
  );
}
