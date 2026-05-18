"use client";

import { FormEvent, useState } from "react";
import { useParentAuth } from "@/lib/hooks/useParentAuth";
import { useLanguage, type Language } from "@/lib/i18n";

const copy: Record<
  Language,
  {
    body: string;
    code: string;
    codeSent: string;
    email: string;
    eyebrow: string;
    requestCode: string;
    requestFailed: string;
    signedInAs: string;
    signingIn: string;
    signOut: string;
    title: string;
    verify: string;
    verifyFailed: string;
  }
> = {
  en: {
    body: "Use a parent email to create homes, pair wall screens, and manage grown-up settings.",
    code: "Code",
    codeSent: "Code sent. Check your email.",
    email: "Email",
    eyebrow: "Grown-up access",
    requestCode: "Send code",
    requestFailed: "Could not send the code. Try again.",
    signedInAs: "Signed in as",
    signingIn: "Signing in…",
    signOut: "Sign out",
    title: "Sign in as a grown-up",
    verify: "Verify code",
    verifyFailed: "Could not verify the code. Check it and try again.",
  },
  sv: {
    body: "Använd en förälders e-post för att skapa hem, koppla väggskärmar och hantera vuxeninställningar.",
    code: "Kod",
    codeSent: "Koden är skickad. Kolla din e-post.",
    email: "E-post",
    eyebrow: "Vuxenåtkomst",
    requestCode: "Skicka kod",
    requestFailed: "Kunde inte skicka koden. Försök igen.",
    signedInAs: "Inloggad som",
    signingIn: "Loggar in…",
    signOut: "Logga ut",
    title: "Logga in som vuxen",
    verify: "Verifiera kod",
    verifyFailed: "Kunde inte verifiera koden. Kontrollera och försök igen.",
  },
};

export function ParentAuthCard({ compact = false, onSignedIn }: { compact?: boolean; onSignedIn?: () => void }) {
  const { language } = useLanguage();
  const text = copy[language];
  const { isLoading, isSignedIn, requestCode, signOut, user, verifyCode } = useParentAuth();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await requestCode(email);
      setHasRequestedCode(true);
      setMessage(text.codeSent);
    } catch (unknownError) {
      console.warn("HomeBoard could not request parent auth code.", unknownError);
      setError(text.requestFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const nextUser = await verifyCode(email, token);
      if (nextUser) onSignedIn?.();
    } catch (unknownError) {
      console.warn("HomeBoard could not verify parent auth code.", unknownError);
      setError(text.verifyFailed);
    } finally {
      setSubmitting(false);
    }
  }

  if (isSignedIn && user) {
    return (
      <section className={`rounded-[1.7rem] border border-emerald-100 bg-emerald-50 p-4 text-stone-950 shadow-sm ${compact ? "" : "sm:p-5"}`}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{text.eyebrow}</p>
        <p className="mt-2 text-base font-bold text-stone-700">{text.signedInAs}</p>
        <p className="mt-1 break-all text-lg font-black text-stone-950">{user.email ?? user.id}</p>
        <button className="pressable mt-4 min-h-11 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm" onClick={signOut} type="button">
          {text.signOut}
        </button>
      </section>
    );
  }

  return (
    <section className={`rounded-[1.7rem] border border-stone-200 bg-white p-4 text-stone-950 shadow-sm ${compact ? "" : "sm:p-5"}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{text.eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-stone-950">{text.title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{text.body}</p>

      <form className="mt-4 space-y-3" onSubmit={hasRequestedCode ? verifyEmailCode : requestEmailCode}>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{text.email}</span>
          <input
            autoComplete="email"
            className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-bold text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        {hasRequestedCode ? (
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{text.code}</span>
            <input
              autoComplete="one-time-code"
              className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xl font-black tracking-[0.18em] text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
              inputMode="numeric"
              onChange={(event) => setToken(event.target.value)}
              required
              value={token}
            />
          </label>
        ) : null}

        {message ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

        <button className="pressable min-h-12 w-full rounded-2xl bg-stone-950 px-4 py-3 font-black text-white shadow-lg shadow-stone-950/15 disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading || isSubmitting || !email.trim() || (hasRequestedCode && !token.trim())} type="submit">
          {isSubmitting ? text.signingIn : hasRequestedCode ? text.verify : text.requestCode}
        </button>
      </form>
    </section>
  );
}
