"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { isCloudConfigured } from "@/lib/cloud/config";
import { saveSelectedHouseholdId } from "@/lib/households/selection";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { useLanguage, type Language } from "@/lib/i18n";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { createHouseholdService } from "@/lib/services/householdService";
import type { Household } from "@/types";

const service = createHouseholdService(householdRepository);
const memberColors = ["#8b5cf6", "#14b8a6", "#f97316", "#0ea5e9"];

type SetupStep = "choose" | "name" | "members";

const setupCopy: Record<
  Language,
  {
    add: string;
    back: string;
    body: string;
    chooseExisting: string;
    chooseHome: string;
    continue: string;
    continueWithHome: string;
    create: string;
    createNewHome: string;
    creating: string;
    defaultName: string;
    emptyMembersHint: string;
    error: string;
    eyebrow: string;
    householdName: string;
    initialMembers: string;
    initialMembersCopy: string;
    listError: string;
    loadingHomes: string;
    member: string;
    nameBody: string;
    nameTitle: string;
    remembersChoice: string;
    skipMembers: string;
    startNew: string;
    stepHome: string;
    stepMembers: string;
    stepReady: string;
    thisHome: string;
    title: string;
  }
> = {
  en: {
    add: "Add person",
    back: "Back",
    body: "Create a home for the family board or continue with one that already exists. HomeBoard remembers the choice on this device.",
    chooseExisting: "Use existing home",
    chooseHome: "Choose home",
    continue: "Continue",
    continueWithHome: "Continue",
    create: "Create home",
    createNewHome: "Create new home",
    creating: "Creating…",
    defaultName: "Our Home",
    emptyMembersHint: "You can add members later too.",
    error: "Could not create the home. Try again in a moment.",
    eyebrow: "Home setup",
    householdName: "What should the home be called?",
    initialMembers: "Who lives here?",
    initialMembersCopy: "Add the first people who should appear on the board. You can change this later.",
    listError: "We could not load existing homes right now. You can still create a new home.",
    loadingHomes: "Looking for homes…",
    member: "Person",
    nameBody: "Use something simple, like “Our Home” or the family name.",
    nameTitle: "Name your home",
    remembersChoice: "HomeBoard remembers this choice on this device.",
    skipMembers: "Skip for now",
    startNew: "Start a new home",
    stepHome: "Home",
    stepMembers: "People",
    stepReady: "Ready",
    thisHome: "This home",
    title: "Let’s connect this screen to a home.",
  },
  sv: {
    add: "Lägg till person",
    back: "Tillbaka",
    body: "Skapa ett hem för familjetavlan eller fortsätt med ett som redan finns. HomeBoard kommer ihåg valet på den här enheten.",
    chooseExisting: "Använd befintligt hem",
    chooseHome: "Välj hem",
    continue: "Fortsätt",
    continueWithHome: "Fortsätt",
    create: "Skapa hem",
    createNewHome: "Skapa nytt hem",
    creating: "Skapar…",
    defaultName: "Vårt hem",
    emptyMembersHint: "Du kan lägga till medlemmar senare också.",
    error: "Kunde inte skapa hemmet. Försök igen om en stund.",
    eyebrow: "Hemsetup",
    householdName: "Vad ska hemmet heta?",
    initialMembers: "Vilka bor här?",
    initialMembersCopy: "Lägg till de första personerna som ska synas på tavlan. Du kan ändra detta senare.",
    listError: "Vi kunde inte ladda befintliga hem just nu. Du kan fortfarande skapa ett nytt hem.",
    loadingHomes: "Letar efter hem…",
    member: "Person",
    nameBody: "Välj något enkelt, som “Vårt hem” eller familjens namn.",
    nameTitle: "Namnge ert hem",
    remembersChoice: "HomeBoard kommer ihåg valet på den här enheten.",
    skipMembers: "Hoppa över så länge",
    startNew: "Starta ett nytt hem",
    stepHome: "Hem",
    stepMembers: "Personer",
    stepReady: "Klart",
    thisHome: "Det här hemmet",
    title: "Nu kopplar vi skärmen till ett hem.",
  },
};

function StepPill({ active, done, label }: { active: boolean; done?: boolean; label: string }) {
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition-colors duration-200 ease-[var(--ease-out)] ${active ? "bg-stone-950 text-white" : done ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-400"}`}>
      {label}
    </span>
  );
}

export function HouseholdSetupGate({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const copy = setupCopy[language];
  const { householdId } = useResolvedHouseholdId();
  const [step, setStep] = useState<SetupStep>("choose");
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

  async function createHome() {
    const name = householdName.trim();
    if (!name) return;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "name") {
      setStep("members");
      return;
    }
    await createHome();
  }

  const showHouseholdList = households.length > 0;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl items-center justify-center px-4 py-6 text-stone-950">
      <section className="surface-card w-full overflow-hidden rounded-[2.4rem] shadow-2xl shadow-amber-950/10" aria-labelledby="household-setup-title">
        <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-stone-50 p-5 sm:p-7">
          <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-300" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{copy.eyebrow}</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-stone-950 sm:text-5xl" id="household-setup-title">
            {copy.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-stone-600">{copy.body}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StepPill active={step === "choose"} done={step !== "choose"} label={copy.stepHome} />
            <StepPill active={step === "name"} done={step === "members"} label={copy.createNewHome} />
            <StepPill active={step === "members"} label={copy.stepMembers} />
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {isLoadingHouseholds ? <p className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-600">{copy.loadingHomes}</p> : null}
          {listError ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{listError}</p> : null}

          {step === "choose" && !isLoadingHouseholds ? (
            <div className="space-y-5">
              {showHouseholdList ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-stone-500">{copy.chooseHome}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {households.map((household) => (
                      <button
                        className="pressable min-h-28 rounded-[1.6rem] border border-stone-200 bg-white p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-150 ease-[var(--ease-out)] hover:border-amber-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        key={household.id}
                        onClick={() => selectHousehold(household.id)}
                        type="button"
                      >
                        <span className="block text-xl font-black text-stone-950">{household.name}</span>
                        <span className="mt-2 block text-sm font-bold text-stone-500">{copy.continueWithHome}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <button
                className="pressable flex min-h-20 w-full items-center justify-between gap-4 rounded-[1.8rem] bg-stone-950 px-5 py-4 text-left text-white shadow-lg shadow-stone-950/15"
                onClick={() => setStep("name")}
                type="button"
              >
                <span>
                  <span className="block text-xl font-black">{copy.startNew}</span>
                  <span className="mt-1 block text-sm font-bold text-white/60">{copy.remembersChoice}</span>
                </span>
                <span className="text-3xl font-black" aria-hidden>
                  →
                </span>
              </button>
            </div>
          ) : null}

          {step !== "choose" && !isLoadingHouseholds ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {step === "name" ? (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-stone-950">{copy.nameTitle}</h3>
                    <p className="mt-2 text-base font-semibold leading-7 text-stone-600">{copy.nameBody}</p>
                  </div>
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{copy.householdName}</span>
                    <input
                      autoFocus
                      className="mt-2 min-h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xl font-black text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
                      onChange={(event) => setHouseholdName(event.target.value)}
                      required
                      value={householdName}
                    />
                  </label>
                </section>
              ) : null}

              {step === "members" ? (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-stone-950">{copy.initialMembers}</h3>
                    <p className="mt-2 text-base font-semibold leading-7 text-stone-600">{copy.initialMembersCopy}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {memberNames.map((memberName, index) => (
                      <label className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-3" key={index}>
                        <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                          <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: memberColors[index % memberColors.length] }} />
                          {copy.member} {index + 1}
                        </span>
                        <input
                          className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-base font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
                          onChange={(event) => setMemberNames((current) => current.map((value, nextIndex) => (nextIndex === index ? event.target.value : value)))}
                          placeholder={`${copy.member} ${index + 1}`}
                          value={memberName}
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm"
                      onClick={() => setMemberNames((current) => [...current, ""])}
                      type="button"
                    >
                      {copy.add}
                    </button>
                    {!initialMembers.length ? <p className="self-center text-sm font-bold text-stone-500">{copy.emptyMembersHint}</p> : null}
                  </div>
                </section>
              ) : null}

              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

              <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                <button
                  className="pressable min-h-12 rounded-2xl border border-stone-200 bg-white px-5 py-3 font-black text-stone-700 shadow-sm"
                  onClick={() => setStep(step === "members" ? "name" : "choose")}
                  type="button"
                >
                  {copy.back}
                </button>
                <button className="pressable min-h-12 rounded-2xl bg-stone-950 px-5 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || !householdName.trim()} type="submit">
                  {isSaving ? copy.creating : step === "members" ? copy.create : copy.continue}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
