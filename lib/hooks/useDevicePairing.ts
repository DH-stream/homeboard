"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isCloudConfigured } from "@/lib/cloud/config";
import { getOrCreateLocalDeviceIdentity, getPersistedCloudDeviceId } from "@/lib/devices/deviceIdentity";
import { devicePairingRepository } from "@/lib/repositories/devicePairingRepository";
import { createDevicePairingService } from "@/lib/services/devicePairingService";
import type { DevicePairingSession } from "@/types";

const service = createDevicePairingService(devicePairingRepository);
const WALL_POLL_INTERVAL_MS = 3000;

export function useWallDevicePairing(enabled: boolean) {
  const [session, setSession] = useState<DevicePairingSession | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPair = enabled && isCloudConfigured();

  const createSession = useCallback(async () => {
    if (!canPair) return null;
    setLoading(true);
    setError(null);
    try {
      const localIdentity = getOrCreateLocalDeviceIdentity();
      if (!localIdentity) throw new Error("Device identity unavailable.");
      const nextSession = await service.createWallPairingSession({
        deviceName: "Väggskärm",
        mode: "wall",
        localDeviceId: localIdentity.id,
        persistedDeviceId: getPersistedCloudDeviceId() ?? undefined,
      });
      setSession(nextSession);
      return nextSession;
    } catch (unknownError) {
      console.warn("HomeBoard could not create a wall pairing session.", unknownError);
      setError("pairing_unavailable");
      return null;
    } finally {
      setLoading(false);
    }
  }, [canPair]);

  useEffect(() => {
    if (!canPair || session) return;
    createSession();
  }, [canPair, createSession, session]);

  useEffect(() => {
    if (!canPair || !session || session.status !== "pending") return;

    const timer = window.setInterval(async () => {
      try {
        const nextSession = await service.getPairingSession(session.pairingCode);
        if (nextSession) setSession(nextSession);
      } catch (unknownError) {
        console.warn("HomeBoard could not refresh the wall pairing session.", unknownError);
      }
    }, WALL_POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [canPair, session]);

  return { canPair, createSession, error, isLoading, session };
}

export function usePairingCode(pairingCode: string | null) {
  const normalizedCode = useMemo(() => pairingCode?.trim().toUpperCase() || null, [pairingCode]);
  const [session, setSession] = useState<DevicePairingSession | null>(null);
  const [isLoading, setLoading] = useState(Boolean(normalizedCode));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!normalizedCode) {
      setSession(null);
      setError("missing_code");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextSession = await service.getPairingSession(normalizedCode);
      setSession(nextSession);
      setError(nextSession ? null : "not_found");
    } catch (unknownError) {
      console.warn("HomeBoard could not load the pairing code.", unknownError);
      setError("unavailable");
    } finally {
      setLoading(false);
    }
  }, [normalizedCode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const claim = useCallback(
    async (householdId: string, memberId?: string) => {
      if (!normalizedCode) throw new Error("Missing pairing code.");
      const claimedSession = await service.claimPairingSession(normalizedCode, householdId, memberId);
      setSession(claimedSession);
      return claimedSession;
    },
    [normalizedCode],
  );

  return { claim, error, isLoading, refresh, session };
}
