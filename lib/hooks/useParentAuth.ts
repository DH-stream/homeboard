"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentParentUser, PARENT_AUTH_CHANGED_EVENT, requestParentEmailCode, signOutParent, verifyParentEmailCode, type ParentAuthUser } from "@/lib/auth/parentAuth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type ParentAuthStatus = "loading" | "signed_out" | "signed_in";

export function useParentAuth() {
  const [user, setUser] = useState<ParentAuthUser | null>(null);
  const [status, setStatus] = useState<ParentAuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const refreshInFlightRef = useRef(false);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    if (!options?.silent && !hasLoadedOnceRef.current) {
      setStatus("loading");
    }
    setError(null);

    try {
      const nextUser = await getCurrentParentUser();
      setUser(nextUser);
      setStatus(nextUser ? "signed_in" : "signed_out");
    } catch (unknownError) {
      console.warn("HomeBoard could not read parent auth state.", unknownError);
      setUser(null);
      setStatus("signed_out");
    } finally {
      hasLoadedOnceRef.current = true;
      refreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleAuthChanged = () => void refresh({ silent: true });
    window.addEventListener(PARENT_AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(PARENT_AUTH_CHANGED_EVENT, handleAuthChanged);
  }, [refresh]);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user
        ? {
            id: session.user.id,
            email: session.user.email ?? undefined,
          }
        : null;

      setUser(nextUser);
      setStatus(nextUser ? "signed_in" : "signed_out");
      hasLoadedOnceRef.current = true;
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const requestCode = useCallback(async (email: string) => {
    setError(null);
    await requestParentEmailCode(email);
  }, []);

  const verifyCode = useCallback(async (email: string, token: string) => {
    setError(null);
    const nextUser = await verifyParentEmailCode(email, token);
    setUser(nextUser);
    setStatus(nextUser ? "signed_in" : "signed_out");
    hasLoadedOnceRef.current = true;
    return nextUser;
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await signOutParent();
    setUser(null);
    setStatus("signed_out");
    hasLoadedOnceRef.current = true;
  }, []);

  return {
    error,
    isLoading: status === "loading",
    isSignedIn: status === "signed_in",
    refresh,
    requestCode,
    setError,
    signOut,
    status,
    user,
    verifyCode,
  };
}