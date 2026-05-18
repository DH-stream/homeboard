"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { ParentAuthCard } from "@/components/auth/ParentAuthCard";
import { isCloudConfigured } from "@/lib/cloud/config";
import { saveSelectedHouseholdId } from "@/lib/households/selection";
import { useParentAuth } from "@/lib/hooks/useParentAuth";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { useLanguage, type Language } from "@/lib/i18n";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { createHouseholdService } from "@/lib/services/householdService";
import type { Household } from "@/types";

const service = createHouseholdService(householdRepository);
const memberColors = ["#8b5cf6", "#14b8a6", "#f97316", "#0ea5e9"];

const setupCopy: Record<
  Language,
  {
    add: string;
    body: string;
    chooseHome: string;
    continueWithHome: string;
    create: string;
    createNewHome: string;
    creating: string;
    defaultName: string;
    error: string;
    eyebrow: string;
    householdName: string;
    initialMembers: string;
    initialMembersCopy: string;
    listError: string;
    loadingHomes: string;
    member: string;
    parentRequired: string;
    remembersChoice: string;
    thisHome: string;
    title: string;
  }
> = {
  en: {
    add: "Add",
    body: "Choose an existing home or create a new one. HomeBoard remembers this choice on this device.",
    chooseHome: "Choose home",
    continueWithHome: "Continue with this home",
    create: "Create home",
    createNewHome: "Create new home",
    creating: "Creating…",
    defaultName: "Our Home",
    error: "Could not create home. Try again in a moment.",
    eyebrow: "Home setup",
    householdName: "Home name",
    initialMembers: "Initial members",
    initialMembersCopy: "Optional. Add the people who should appear first.",
    listError: "We could not load existing homes right now. You can still create a new home.",
    loadingHomes: "Loading homes…",
    member: "Member",
    parentRequired: "Sign in as a grown-up before creating a new home.",
    remembersChoice: "HomeBoard remembers this choice on this device.",
    thisHome: "This home",
    title: "Choose your HomeBoard home.",
  },
  sv: {
    add: "Lägg till",
    body: "Välj ett hem som redan finns eller skapa ett nytt. HomeBoard kommer ihåg valet på den här enheten.",
    chooseHome: "Välj hem",
    continueWithHome: "Fortsätt med det här hemmet",
    create: "Skapa hem",
    createNewHome: "Skapa nytt hem",
    creating: "Skapar…",
    defaultName: "Vårt hem",
    error: "Kunde inte skapa hem. Försök igen om en stund.",
    eyebrow: "Hemsetup",
    householdName: "Namn på hemmet",
    initialMembers: "Första medlemmarna",
    initialMembersCopy: "Valfritt. Lägg till personerna som ska visas först.",
    listError: "Vi kunde inte ladda befintliga hem just nu. Du kan fortfarande skapa ett nytt hem.",
    loadingHomes: "Laddar hem…",
    member: "Medlem",
    parentRequired: "Logga in som vuxen innan du skapar ett nytt hem.",
    remembersChoice: "HomeBoard kommer ihåg valet på den här enheten.",
    thisHome: "Det här hemmet",
    title: "Välj ditt HomeBoard-hem.",
  },
};

export function HouseholdSetupGate({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const copy = setupCopy[language];
  const { householdId } = useResolvedHouseholdId();
  const { isLoading: isParentAuthLoading, isSignedIn: isParentSignedIn } = useParentAuth();
  const [householdName, setHouseholdName] = useState(copy.defaultName);
  const [memberNames, setMemberNames] = useState(["", ""]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoadingHouseholds, setLoadingHouseholds] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const initialMembers = useMemo(
    () =>
      memberNames
        .map((name, index) => ({ displayName: name.trim(), color: memberColors[index % memberColors.length], role: "adult" as const }))
        .filter((member) => member.displayName),
    [memberNames],
  );

  useEffect(() => {
    if (!isCloudConfigured() || householdId) return;

    let isMounted = true;
    setLoadingHouseholds(true);
    setListError(null);

    service
      .listHouseholds()
      .then((nextHouseholds) => {
        if (isMounted) setHouseholds(nextHouseholds);
      })
      .catch((nextError) => {
        console.warn("HomeBoard could not list cloud homes during setup.", nextError);
        if (isMounted) {
          setHouseholds([]);
          setListError(copy.listError);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingHouseholds(false);
      });

    return () => {
      isMounted = false;
    };
  }, [copy.listError, householdId]);

  if (!isCloudConfigured() || householdId) return <>{children}</>;

  function selectHousehold(nextHouseholdId: string) {
    saveSelectedHouseholdId(nextHouseholdId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = householdName.trim();
    if (!name || !isParentSignedIn) return;

    setSaving(true);
    setError(null);

    try {
      const household = await service.createHousehold({ name });
      await service.createHouseholdMembers(household.id, initialMembers);
      saveSelectedHouseholdId(household.id);
    } catch (nextError) {
      console.warn("HomeBoard could not create a cloud home during setup.", nextError);
      setError(copy.error);
    } finally {
      setSaving(false);
    }
  }

  const showHouseholdList = households.length > 0;

  return (
    <section className="surface-card mx-auto mt-4 max-w-xl rounded-[2rem] p-5 shadow-xl shadow-amber-900/5 sm:p-6" aria-labelledby="household-setup-title">
      <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-300" />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{copy.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-950" id="household-setup-title">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{copy.body}</p>

      {isLoadingHouseholds ? <p className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-600">{copy.loadingHomes}</p> : null}
      {listError ? <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{listError}</p> : null}

      {showHouseholdList ? (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-stone-500">{copy.chooseHome}</h3>
          <div className="space-y-2">
            {households.map((household) => (
              <button
                className="pressable flex min-h-16 w-full items-center justify-between gap-3 rounded-[1.5rem] border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-150 ease-[var(--ease-out)] hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                key={household.id}
                onClick={() => selectHousehold(household.id)}
                type="button"
              >
                <span>
                  <span className="block text-base font-black text-stone-950">{household.name}</span>
                  <span className="mt-0.5 block text-xs font-bold uppercase tracking-[0.14em] text-stone-400">{copy.thisHome}</span>
                </span>
                <span className="shrink-0 text-sm font-black text-amber-700">{copy.continueWithHome}</span>
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-stone-500">{copy.remembersChoice}</p>
        </div>
      ) : null}

      {!isLoadingHouseholds ? (
        <div className="mt-5 space-y-4">
          <ParentAuthCard compact />
          {!isParentSignedIn ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{copy.parentRequired}</p> : null}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-stone-500">{copy.createNewHome}</h3>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{copy.householdName}</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                disabled={!isParentSignedIn}
                onChange={(event) => setHouseholdName(event.target.value)}
                required
                value={householdName}
              />
            </label>

            <div className="rounded-[1.5rem] border border-stone-200/80 bg-stone-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{copy.initialMembers}</p>
                  <p className="text-sm font-semibold text-stone-600">{copy.initialMembersCopy}</p>
                </div>
                <button
                  className="pressable min-h-10 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-black text-stone-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!isParentSignedIn}
                  onClick={() => setMemberNames((current) => [...current, ""])}
                  type="button"
                >
                  {copy.add}
                </button>
              </div>
              <div className="space-y-2">
                {memberNames.map((memberName, index) => (
                  <label className="flex items-center gap-2" key={index}>
                    <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: memberColors[index % memberColors.length] }} />
                    <input
                      className="min-h-11 flex-1 rounded-2xl border border-stone-200 bg-white px-3 py-2 font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                      disabled={!isParentSignedIn}
                      onChange={(event) => setMemberNames((current) => current.map((value, nextIndex) => (nextIndex === index ? event.target.value : value)))}
                      placeholder={`${copy.member} ${index + 1}`}
                      value={memberName}
                    />
                  </label>
                ))}
              </div>
            </div>

            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

            <button className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-4 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || isParentAuthLoading || !isParentSignedIn || !householdName.trim()} type="submit">
              {isSaving ? copy.creating : copy.create}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}