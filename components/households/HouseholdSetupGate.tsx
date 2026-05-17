"use client";

import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { createHouseholdService } from "@/lib/services/householdService";
import { saveSelectedHouseholdId } from "@/lib/households/selection";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { useLanguage } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const service = createHouseholdService(householdRepository);
const memberColors = ["#8b5cf6", "#14b8a6", "#f97316", "#0ea5e9"];

export function HouseholdSetupGate({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { householdId } = useResolvedHouseholdId();
  const [householdName, setHouseholdName] = useState(t("householdSetupDefaultName"));
  const [memberNames, setMemberNames] = useState(["", ""]);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialMembers = useMemo(
    () =>
      memberNames
        .map((name, index) => ({ displayName: name.trim(), color: memberColors[index % memberColors.length], role: "adult" as const }))
        .filter((member) => member.displayName),
    [memberNames],
  );

  if (!isSupabaseConfigured() || householdId) return <>{children}</>;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = householdName.trim();
    if (!name) return;

    setSaving(true);
    setError(null);

    try {
      const household = await service.createHousehold({ name });
      await service.createHouseholdMembers(household.id, initialMembers);
      saveSelectedHouseholdId(household.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("householdSetupError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="surface-card mx-auto mt-4 max-w-xl rounded-[2rem] p-5 shadow-xl shadow-amber-900/5 sm:p-6" aria-labelledby="household-setup-title">
      <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-300" />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{t("householdSetupEyebrow")}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-950" id="household-setup-title">
        {t("householdSetupTitle")}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{t("householdSetupBody")}</p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{t("householdName")}</span>
          <input
            className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
            onChange={(event) => setHouseholdName(event.target.value)}
            required
            value={householdName}
          />
        </label>

        <div className="rounded-[1.5rem] border border-stone-200/80 bg-stone-50 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{t("initialMembers")}</p>
              <p className="text-sm font-semibold text-stone-600">{t("initialMembersCopy")}</p>
            </div>
            <button
              className="pressable min-h-10 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-black text-stone-800 shadow-sm"
              onClick={() => setMemberNames((current) => [...current, ""])}
              type="button"
            >
              {t("add")}
            </button>
          </div>
          <div className="space-y-2">
            {memberNames.map((memberName, index) => (
              <label className="flex items-center gap-2" key={index}>
                <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: memberColors[index % memberColors.length] }} />
                <input
                  className="min-h-11 flex-1 rounded-2xl border border-stone-200 bg-white px-3 py-2 font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
                  onChange={(event) => setMemberNames((current) => current.map((value, nextIndex) => (nextIndex === index ? event.target.value : value)))}
                  placeholder={`${t("member")} ${index + 1}`}
                  value={memberName}
                />
              </label>
            ))}
          </div>
        </div>

        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

        <button className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-4 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || !householdName.trim()} type="submit">
          {isSaving ? t("creating") : t("createHousehold")}
        </button>
      </form>
    </section>
  );
}
