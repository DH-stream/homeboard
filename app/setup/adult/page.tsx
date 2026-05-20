"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readDeviceStartView, setDeviceProfile } from "@/lib/devicePreferences";
import { saveSelectedHouseholdId } from "@/lib/households/selection";
import { useLanguage } from "@/lib/i18n";
import { useParentAuth } from "@/lib/hooks/useParentAuth";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4;

const slots = [{ top: "16%", left: "7%" }, { top: "22%", right: "8%" }, { top: "40%", left: "11%" }, { top: "43%", right: "13%" }, { bottom: "24%", left: "16%" }] satisfies CSSProperties[];
const tones = ["amber", "emerald", "sky", "rose", "stone"] as const;

function AdultSetupStepPanel({ step, children }: { step: Step; children: ReactNode }) {
  return <div key={step} className="adult-setup-step-panel">{children}</div>;
}

export default function AdultSetupPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { isSignedIn, user, requestCode, verifyCode, refresh } = useParentAuth();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [homeName, setHomeName] = useState(language === "sv" ? "Vårt hem" : "Our home");
  const [homes, setHomes] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSignedInReturn, setShowSignedInReturn] = useState(false);
  const [showCloseFallback, setShowCloseFallback] = useState(false);
  const authChannelRef = useRef<BroadcastChannel | null>(null);
  const configured = isSupabaseConfigured();
  const hints = useMemo(() => language === "sv" ? ["Anslut kalender", "Bjud in familjen", "Välj väggskärm", "Skydda inställningar", "Synka hemmet"] : ["Connect calendar", "Invite family", "Choose wall screen", "Keep kids safe", "Sync the home"], [language]);
  const stepLabels = useMemo(() => language === "sv" ? ["E-post", "Kod", "Hem", "Klart"] : ["Email", "Verify", "Home", "Done"], [language]);

  useEffect(() => {
    if (!isSignedIn) return;
    const startedHere = typeof window !== "undefined" && window.sessionStorage.getItem("homeboard.adult.setup.started") === "1";
    if (step < 3) {
      if (startedHere) setStep(3);
      else setShowSignedInReturn(true);
    }
    if (typeof window !== "undefined") {
      const completedAt = String(Date.now());
      window.localStorage.setItem("homeboard.auth.completedAt", completedAt);
      authChannelRef.current?.postMessage({ type: "auth-completed", at: completedAt });
    }
  }, [isSignedIn, step]);
  useEffect(() => { if (step !== 4) return; const mode = readDeviceStartView()?.mode; const returnTo = mode === "wall" ? "/wall" : "/app"; const id = window.setTimeout(() => router.replace(`/settings?returnTo=${encodeURIComponent(returnTo)}`), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 700 : 1600); return () => window.clearTimeout(id); }, [router, step]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "homeboard.auth.completedAt" || !event.newValue) return;
      void refresh({ silent: true });
    };
    const channel = "BroadcastChannel" in window ? new BroadcastChannel("homeboard-auth") : null;
    authChannelRef.current = channel;
    channel?.addEventListener("message", () => void refresh({ silent: true }));
    window.addEventListener("storage", onStorage);
    return () => {
      channel?.close();
      authChannelRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);
  useEffect(() => {
    if (!configured || !isSignedIn || !user) return;
    householdRepository.listHouseholds().then(async (list) => {
      const joined = await Promise.all(list.map(async (h) => ({ h, members: await householdRepository.listHouseholdMembers(h.id) })));
      setHomes(joined.filter((r) => r.members.some((m) => m.userId === user.id && m.role === "adult")).map((r) => ({ id: r.h.id, name: r.h.name })));
    }).catch(() => setHomes([]));
  }, [configured, isSignedIn, user]);

  const msg = (en: string, sv: string) => (language === "sv" ? sv : en);
  const sendCode = async () => { setError(null); setBusy(true); try { await requestCode(email, { redirectTo: "/setup/adult" });
      if (typeof window !== "undefined") window.sessionStorage.setItem("homeboard.adult.setup.started", "1");
      setStep(2); } catch { setError(msg("We couldn’t send the code right now. Try again in a moment.", "Vi kunde inte skicka koden just nu. Försök igen om en stund.")); } finally { setBusy(false); } };
  const submitCode = async () => { setError(null); setBusy(true); try { await verifyCode(email, otp); await refresh({ silent: true }); setStep(3); } catch { setError(msg("We couldn’t verify that code. Check it and try again.", "Vi kunde inte verifiera koden. Kontrollera koden och försök igen.")); } finally { setBusy(false); } };

  const finalizeHousehold = async (householdId: string) => {
    if (!user) return;
    setError(null); setBusy(true);
    try {
      const members = await householdRepository.listHouseholdMembers(householdId);
      if (!members.some((m) => m.userId === user.id && m.role === "adult")) throw new Error("not_adult");
      saveSelectedHouseholdId(householdId);
      setDeviceProfile("admin");
      setStep(4);
    } catch {
      setError(msg("We couldn’t connect that home right now. Try again in a moment.", "Vi kunde inte koppla hemmet just nu. Försök igen om en stund."));
    } finally { setBusy(false); }
  };

  const createHome = async () => {
    if (!user) return;
    setError(null); setBusy(true);
    try {
      const h = await householdRepository.createHousehold({ name: homeName.trim() || msg("Our home", "Vårt hem"), ownerUserId: user.id });
      await householdRepository.createHouseholdMembers(h.id, [{ displayName: user.email ?? "Adult", color: "amber", role: "adult", userId: user.id }]);
      await finalizeHousehold(h.id);
    } catch { setError(msg("We couldn’t create the home right now. Try again in a moment.", "Vi kunde inte skapa hemmet just nu. Försök igen om en stund.")); setBusy(false); }
  };

  return (
    <main className="setup-stage relative isolate min-h-screen overflow-hidden px-3 py-4 sm:px-6 sm:py-10">
      <div className="setup-sky z-0" aria-hidden="true" />
      <div className="setup-task-hints" aria-hidden="true">
        {hints.map((hint, i) => <span key={hint} style={slots[i]} className={`setup-task-hint setup-task-hint--visible setup-task-hint--tone-${tones[i]}`}>{hint}</span>)}
      </div>
      <section className="setup-hero relative z-10 mx-auto flex min-h-[calc(100svh-2rem)] max-w-5xl flex-col justify-center py-3 sm:min-h-[calc(100vh-5rem)] sm:max-w-6xl sm:py-8">
        <div className={`surface-card setup-hero-card adult-setup-card relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] px-4 py-6 backdrop-blur-xl sm:rounded-[3rem] sm:px-8 sm:py-10 ${step === 4 ? "adult-setup-card--success" : ""}`}>
          <div className="setup-card-shine" />
          <div className="setup-card-wake" />
          {step < 4 ? <Link href="/" className="adult-setup-back pressable">← {language === "sv" ? "Tillbaka" : "Back"}</Link> : null}
          <div className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-[1.3rem] bg-white/86 text-3xl">🔐</div>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.32em] text-amber-700">HomeBoard</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-stone-950 sm:text-5xl">{msg("Set up your home", "Sätt upp ditt hem")}</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6 text-stone-600">{msg("Sign in as a grown-up to connect calendars, members and settings.", "Logga in som vuxen för att ansluta kalender, medlemmar och inställningar.")}</p>
          </div>

          <div className="adult-stepper mt-6">
            <span className="adult-stepper__progress" style={{ transform: `scaleX(${(step - 1) / 3})` }} />
            {stepLabels.map((label, i) => {
              const index = i + 1;
              const done = step > index;
              const active = step === index;
              return <div key={label} className="adult-stepper__item"><span className={`adult-stepper__dot ${done ? "adult-stepper__dot--done" : ""} ${active ? "adult-stepper__dot--active" : ""}`}>{done ? "✓" : index}</span><span className="adult-stepper__label">{label}</span></div>;
            })}
          </div>

          {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

          <div className="adult-step-shell mt-4">
            {!configured ? <AdultSetupStepPanel step={1}><div className="rounded-3xl bg-white/70 p-5 text-center ring-1 ring-white/80"><p className="text-lg font-black text-stone-900">{msg("Sign-in is not connected yet.", "Inloggning är inte ansluten ännu.")}</p><Link href="/" className="pressable mt-4 inline-flex min-h-11 items-center rounded-2xl border border-stone-200 bg-white/90 px-4 py-2 text-sm font-black text-stone-900">{t("backToScreenChoice")}</Link></div></AdultSetupStepPanel> : null}
            {configured && showSignedInReturn ? <AdultSetupStepPanel step={2}><div className="adult-auth-celebration" aria-hidden="true">{[1,2,3,4,5].map((orb) => <span key={orb} className={`adult-auth-balloon adult-auth-balloon--${orb}`} />)}</div><div className="rounded-3xl border border-white/70 bg-white/70 p-5 text-center shadow-[0_20px_60px_rgba(16,185,129,0.16)]"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500 text-2xl font-black text-white">✓</div><p className="mt-3 text-2xl font-black tracking-tight text-stone-950">{msg("You’re signed in", "Du är inloggad")}</p><p className="mt-2 text-sm font-semibold text-stone-700">{msg("You can close this tab and continue where you started.", "Du kan stänga den här fliken och fortsätta där du började.")}</p><button type="button" onClick={() => { setShowCloseFallback(false); window.close(); window.setTimeout(() => setShowCloseFallback(true), 700); }} className="pressable mt-4 min-h-11 w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white">{msg("Close this tab", "Stäng fliken")}</button><button type="button" onClick={() => { setShowSignedInReturn(false); setStep(3); }} className="pressable mt-2 min-h-11 w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm font-black text-stone-900">{msg("Continue setup here", "Fortsätt här")}</button>{showCloseFallback ? <p className="mt-3 text-xs font-semibold text-stone-600">{msg("If this tab did not close automatically, you can close it manually.", "Om fliken inte stängdes automatiskt kan du stänga den manuellt.")}</p> : null}</div></AdultSetupStepPanel> : null}
            {configured && step === 1 ? <AdultSetupStepPanel step={1}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" /><button type="button" onClick={sendCode} disabled={busy || !email.trim()} className="pressable mt-3 min-h-11 w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white">{msg("Continue with email", "Fortsätt med e-post")}</button></AdultSetupStepPanel> : null}
            {configured && step === 2 ? <AdultSetupStepPanel step={2}><p className="text-sm font-semibold text-stone-700">{msg("Enter the code from your email.", "Skriv in koden från din e-post.")}</p><input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 tracking-[0.2em]" /><button type="button" onClick={submitCode} disabled={busy || otp.trim().length < 6} className="pressable mt-3 min-h-11 w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white">{msg("Verify code", "Verifiera kod")}</button><button type="button" onClick={sendCode} className="pressable mt-2 min-h-11 w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm font-black text-stone-900">{msg("Resend", "Skicka igen")}</button></AdultSetupStepPanel> : null}
            {configured && step === 3 ? <AdultSetupStepPanel step={3}>{homes.length ? <><p className="text-sm font-black uppercase tracking-[0.12em] text-stone-600">{msg("Choose your home", "Välj ditt hem")}</p><div className="mt-3 grid gap-2">{homes.map((h) => <button key={h.id} type="button" onClick={() => finalizeHousehold(h.id)} className="pressable min-h-11 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-left text-sm font-black">{h.name}</button>)}</div></> : <><p className="text-sm font-black uppercase tracking-[0.12em] text-stone-600">{msg("Create a new home", "Skapa nytt hem")}</p><label htmlFor="home-name" className="mt-3 block text-sm font-bold text-stone-700">{msg("Home name", "Namn på hemmet")}</label><input id="home-name" value={homeName} onChange={(e) => setHomeName(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" /><button type="button" onClick={createHome} disabled={busy} className="pressable mt-4 min-h-11 w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white">{msg("Create home", "Skapa hem")}</button></>}</AdultSetupStepPanel> : null}
            {configured && step === 4 ? <AdultSetupStepPanel step={4}><div className="adult-done rounded-3xl bg-gradient-to-br from-amber-100 to-emerald-100 p-6 text-center"><div className="adult-done__check mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500 text-2xl font-black text-white">✓</div><p className="mt-3 text-lg font-black text-stone-900">{msg("Home created", "Hem skapat")}</p><p className="mt-1 text-sm font-semibold text-stone-700">{msg("Adult access unlocked", "Vuxenåtkomst upplåst")}</p><p className="mt-1 text-sm font-semibold text-stone-600">{msg("Opening settings…", "Öppnar inställningar…")}</p></div></AdultSetupStepPanel> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
