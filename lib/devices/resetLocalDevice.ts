"use client";

import { signOutParentLocally } from "@/lib/auth/parentAuth";
import { resetDeviceProfile } from "@/lib/devicePreferences";
import {
  clearPersistedCloudDeviceId,
  resetLocalDeviceIdentity,
} from "@/lib/devices/deviceIdentity";
import {
  disableLocalOnlyMode,
  forgetSelectedCloudHouseholdOnThisDevice,
} from "@/lib/households/selection";

export async function resetThisDeviceLocally(options?: {
  clearLocalIdentity?: boolean;
}) {
  await signOutParentLocally();
  forgetSelectedCloudHouseholdOnThisDevice();
  disableLocalOnlyMode();
  resetDeviceProfile();
  clearPersistedCloudDeviceId();

  if (options?.clearLocalIdentity) {
    resetLocalDeviceIdentity();
  }
}
