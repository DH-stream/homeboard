"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export const PARENT_AUTH_CHANGED_EVENT = "homeboard:parent-auth-changed";

export type ParentAuthUser = {
  id: string;
  email?: string;
};

function broadcastParentAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PARENT_AUTH_CHANGED_EVENT));
}

function mapSupabaseUser(user: { id: string; email?: string | null } | null | undefined): ParentAuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? undefined,
  };
}

export async function getCurrentParentUser(): Promise<ParentAuthUser | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return mapSupabaseUser(data.user);
}

export async function requestParentEmailCode(email: string) {
  const client = createBrowserSupabaseClient();
  if (!client) throw new Error("Cloud is not configured.");

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required.");

  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
}

export async function verifyParentEmailCode(email: string, token: string): Promise<ParentAuthUser | null> {
  const client = createBrowserSupabaseClient();
  if (!client) throw new Error("Cloud is not configured.");

  const { data, error } = await client.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });

  if (error) throw error;
  broadcastParentAuthChanged();
  return mapSupabaseUser(data.user);
}

export async function signOutParent() {
  const client = createBrowserSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
  broadcastParentAuthChanged();
}
