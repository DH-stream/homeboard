"use client";

import { useMemo } from "react";
import { useMembers } from "@/lib/hooks/useMembers";
import { useParentAuth } from "@/lib/hooks/useParentAuth";

export function useAdultAccess() {
  const { isSignedIn, user } = useParentAuth();
  const { members } = useMembers();

  const hasAdultAccess = useMemo(() => {
    // Adult access is tied to the signed-in member role, not pairing/device mode.
    if (!isSignedIn || !user) return false;
    return members.some((member) => member.userId === user.id && member.role === "adult");
  }, [isSignedIn, members, user]);

  return { hasAdultAccess, isSignedIn };
}

