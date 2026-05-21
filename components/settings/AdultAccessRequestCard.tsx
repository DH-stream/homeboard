"use client";

import { useEffect, useMemo, useState } from "react";
import { checkDeviceAdultAccess, requestAdultAccess, AdultAccessRequestError } from "@/lib/services/adultAccessService";

type Props = {
  householdId: string | null;
  language: "en" | "sv";
  isWallDevice: boolean;
  hasAdultAccess: boolean;
};

type RequestState = "idle" | "loading" | "enabled" | "requesting" | "requested" | "error";

export function AdultAccessRequestCard({ householdId, language, isWallDevice, hasAdultAccess }: Props) {
  const [state, setState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const copy = useMemo(() => {
    if (language === "sv") {
      return {
        title: "Vuxenåtkomst",
        enabled: "Aktiverad på den här enheten",
        disabled: "Inte aktiverad på den här enheten",
        request: "Begär vuxenåtkomst",
        sent: "Begäran skickad",
        sentBody: "En vuxen i hemmet kan godkänna detta från Inställningar.",
        connectFirst: "Koppla till ett hem först.",
        retryLater: "Begäran nekades nyligen. Försök igen senare.",
        genericError: "Kunde inte skicka begäran just nu.",
      };
    }

    return {
      title: "Adult access",
      enabled: "Enabled on this device",
      disabled: "Not enabled on this device",
      request: "Request adult access",
      sent: "Request sent",
      sentBody: "An adult in this home can approve this from Settings.",
      connectFirst: "Connect to a home first.",
      retryLater: "Request recently denied. Try again later.",
      genericError: "Could not send request right now.",
    };
  }, [language]);

  useEffect(() => {
    if (isWallDevice) return;
    if (hasAdultAccess) {
      setState("enabled");
      setErrorMessage(null);
      return;
    }
    let mounted = true;
    setState("loading");
    setErrorMessage(null);
    void checkDeviceAdultAccess(householdId)
      .then((result) => {
        if (!mounted) return;
        if (result.reason === "missing_context") {
          setState("idle");
          return;
        }
        setState(result.hasAdultAccess ? "enabled" : "idle");
      })
      .catch(() => {
        if (!mounted) return;
        setState("idle");
      });
    return () => {
      mounted = false;
    };
  }, [hasAdultAccess, householdId, isWallDevice]);

  if (isWallDevice) return null;

  const canRequest = Boolean(householdId) && !hasAdultAccess && state !== "enabled" && state !== "requested" && state !== "loading";

  async function onRequest() {
    if (!canRequest || state === "requesting") return;
    setState("requesting");
    setErrorMessage(null);
    try {
      await requestAdultAccess(householdId);
      setState("requested");
    } catch (error) {
      const requestError = error instanceof AdultAccessRequestError ? error : null;
      if (requestError?.kind === "cooldown") {
        setErrorMessage(copy.retryLater);
      } else if (requestError?.kind === "missing_context") {
        setErrorMessage(copy.connectFirst);
      } else {
        setErrorMessage(copy.genericError);
      }
      setState("error");
    }
  }

  const statusLabel = state === "enabled" ? copy.enabled : state === "requested" ? copy.sent : copy.disabled;

  return (
    <div className="rounded-2xl border border-stone-200/70 bg-stone-50/90 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-stone-500">{copy.title}</p>
        <p className="text-xs font-bold text-stone-700">{statusLabel}</p>
      </div>
      {state === "requested" ? <p className="mt-2 text-xs font-semibold text-stone-600">{copy.sentBody}</p> : null}
      {!householdId && state !== "enabled" ? <p className="mt-2 text-xs font-semibold text-stone-600">{copy.connectFirst}</p> : null}
      {errorMessage ? <p className="mt-2 text-xs font-bold text-rose-700">{errorMessage}</p> : null}
      {canRequest ? (
        <button className="pressable mt-2 min-h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-800 disabled:opacity-60" disabled={state === "requesting"} onClick={() => void onRequest()} type="button">
          {copy.request}
        </button>
      ) : null}
    </div>
  );
}
