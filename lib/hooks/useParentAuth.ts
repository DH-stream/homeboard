"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentParentUser, requestParentEmailCode, signOutParent, verifyParentEmailCode, type ParentAuthUser } from "@/lib/auth/parentAuth";

export type ParentAuthStatus = "loading" | "signed_out" | "signed_in";

export function useParentAuth() {
  const [user, setUser] = useState<ParentAuthUser | null>(null);
  const [status, setStatus] = useState<ParentAuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const nextUser = await getCurrentParentUser();
      setUser(nextUser);
      setStatus(nextUser ? "signed_in" : "signed_out");
    } catch (unknownError) {
      console.warn("HomeBoard could not read parent auth state.", unknownError);
      setUser(null);
      setStatus("signed_out");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestCode = useCallback(async (email: string) => {
    setError(null);
    await requestParentEmailCode(email);
  }, []);

  const verifyCode = useCallback(async (email: string, token: string) => {
    setError(null);
    const nextUser = await verifyParentEmailCode(email, token);
    setUser(nextUser);
    setStatus(nextUser ? "signed_in" : "signed_out");
    return nextUser;
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await signOutParent();
    setUser(null);
    setStatus("signed_out");
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
