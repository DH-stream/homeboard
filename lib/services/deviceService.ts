import type { DeviceRepository } from "@/lib/repositories/deviceRepository";

export function createDeviceService(repository: DeviceRepository) {
  return {
    listDevices: (householdId?: string | null) => repository.listDevices(householdId),
    updateDeviceName: (deviceId: string, name: string) => repository.updateDeviceName(deviceId, name),
    unlinkDeviceFromHousehold: (deviceId: string) => repository.unlinkDeviceFromHousehold(deviceId),
  };
}
