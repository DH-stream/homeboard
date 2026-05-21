import type { DeviceRepository } from "@/lib/repositories/deviceRepository";

export function createDeviceService(repository: DeviceRepository) {
  return {
    listDevices: (householdId?: string | null) => repository.listDevices(householdId),
    updateDeviceName: (deviceId: string, name: string) => repository.updateDeviceName(deviceId, name),
    unlinkDeviceFromHousehold: (householdId: string, deviceId: string) => repository.unlinkDeviceFromHousehold(householdId, deviceId),
    getDevice: (deviceId: string) => repository.getDevice(deviceId),
  };
}
