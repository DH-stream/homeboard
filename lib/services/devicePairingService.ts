import type { CreateDevicePairingSessionInput } from "@/types";
import type { DevicePairingRepository } from "@/lib/repositories/devicePairingRepository";

export function createDevicePairingService(repository: DevicePairingRepository) {
  return {
    createWallPairingSession(input: CreateDevicePairingSessionInput) {
      return repository.createWallPairingSession(input);
    },
    getPairingSession(pairingCode: string) {
      return repository.getPairingSession(pairingCode);
    },
    claimPairingSession(pairingCode: string, householdId: string, memberId?: string) {
      return repository.claimPairingSession(pairingCode, householdId, memberId);
    },
    updateDeviceName(deviceId: string, name: string) {
      return repository.updateDeviceName(deviceId, name);
    },
  };
}
