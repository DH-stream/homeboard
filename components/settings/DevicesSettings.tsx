"use client";

import { useState } from "react";
import Link from "next/link";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { useActiveHousehold } from "@/lib/hooks/useActiveHousehold";
import { useDevices } from "@/lib/hooks/useDevices";
import { useLanguage, type Language } from "@/lib/i18n";
import { deviceRepository } from "@/lib/repositories/deviceRepository";
import { createDeviceService } from "@/lib/services/deviceService";
import type { Device } from "@/types";

const service = createDeviceService(deviceRepository);

const copy: Record<Language, Record<string, string>> = {
  en: {
    title: "Devices",
    helper: "Name the screens and phones connected to this home.",
    unnamed: "Unnamed device",
    needsHome: "Choose a cloud home first to view connected devices.",
    lastOnline: "Last online",
    never: "Never",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    loadError: "Could not load devices right now.",
    saveError: "Could not save the device name. Try again.",
    addWallScreen: "Add wall screen",
    addWallIntro: "Start pairing from the wall/tablet screen. This phone scans or enters the code.",
    addWallStep1: "1. Open HomeBoard on the tablet/wall screen.",
    addWallStep2: "2. Choose Wall screen.",
    addWallStep3: "3. Choose Link to household.",
    addWallStep4: "4. Scan the QR code from this phone, or enter the code manually.",
    enterPairingCode: "Enter pairing code",
    mode: "Mode",
  },
  sv: {
    title: "Enheter",
    helper: "Namnge skärmar och mobiler som är kopplade till hemmet.",
    unnamed: "Namnlös enhet",
    needsHome: "Välj ett molnhem först för att se anslutna enheter.",
    lastOnline: "Senast online",
    never: "Aldrig",
    edit: "Redigera",
    save: "Spara",
    cancel: "Avbryt",
    loadError: "Kunde inte ladda enheter just nu.",
    saveError: "Kunde inte spara enhetsnamnet. Försök igen.",
    addWallScreen: "Lägg till väggskärm",
    addWallIntro: "Starta parkopplingen från vägg-/surfplatteskärmen. Den här mobilen skannar eller skriver in koden.",
    addWallStep1: "1. Öppna HomeBoard på surfplattan/väggskärmen.",
    addWallStep2: "2. Välj Väggskärm.",
    addWallStep3: "3. Välj Koppla till hem.",
    addWallStep4: "4. Skanna QR-koden med mobilen, eller skriv in koden manuellt.",
    enterPairingCode: "Ange parkopplingskod",
    mode: "Läge",
  },
};

function formatDateTime(value: string | undefined, language: Language) {
  if (!value) return null;
  return new Intl.DateTimeFormat(language === "sv" ? "sv-SE" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function DevicesSettings() {
  const { householdId } = useActiveHousehold();
  const { language } = useLanguage();
  const t = copy[language];
  const { devices, isLoading, error, setDevices } = useDevices(householdId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  const startEdit = (device: Device) => {
    setEditingId(device.id);
    setEditingName(device.name);
    setSaveError(null);
  };

  async function saveName(deviceId: string) {
    const nextName = editingName.trim();
    if (!nextName) return;

    const previous = devices;
    setSaving(true);
    setSaveError(null);
    setDevices((current) => current.map((device) => (device.id === deviceId ? { ...device, name: nextName } : device)));

    try {
      await service.updateDeviceName(deviceId, nextName);
      setEditingId(null);
    } catch {
      setDevices(previous);
      setSaveError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard status={householdId ? `${devices.length}` : "—"} title={t.title}>
      <div className="space-y-4">
        <p>{t.helper}</p>
        {householdId ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-black text-stone-900">{t.addWallScreen}</p>
            <p className="mt-1 text-sm font-semibold text-stone-600">{t.addWallIntro}</p>
            <ol className="mt-3 space-y-1 text-sm font-semibold text-stone-700">
              <li>{t.addWallStep1}</li><li>{t.addWallStep2}</li><li>{t.addWallStep3}</li><li>{t.addWallStep4}</li>
            </ol>
            <Link className="pressable mt-3 inline-flex min-h-10 items-center rounded-xl border border-stone-200 bg-white px-3 text-sm font-black text-stone-800" href="/pair">{t.enterPairingCode}</Link>
          </div>
        ) : null}
        {!householdId ? <p>{t.needsHome}</p> : null}
        {householdId && isLoading ? <p className="text-sm font-bold text-stone-500">…</p> : null}
        {householdId && error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">{t.loadError}</p> : null}
        {householdId && !isLoading && devices.length === 0 ? <p className="text-sm font-bold text-stone-500">{language === "sv" ? "Inga enheter är kopplade ännu." : "No devices connected yet."}</p> : null}
        {householdId ? (
          <ul className="space-y-2">
            {devices.map((device) => {
              const fallbackName = device.name.trim() || t.unnamed;
              const lastSeen = formatDateTime(device.lastSeenAt, language);
              const isEditing = editingId === device.id;

              return (
                <li className="rounded-2xl border border-stone-200 bg-stone-50 p-3" key={device.id}>
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <input className="min-h-10 w-full rounded-xl border border-stone-200 px-3 font-semibold" onChange={(event) => setEditingName(event.target.value)} value={editingName} />
                      <div className="flex gap-2">
                        <button className="pressable min-h-10 rounded-xl bg-stone-950 px-3 text-sm font-black text-white" disabled={isSaving || !editingName.trim()} onClick={() => void saveName(device.id)} type="button">{t.save}</button>
                        <button className="pressable min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-black text-stone-700" onClick={() => setEditingId(null)} type="button">{t.cancel}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-black text-stone-900">{fallbackName}</p>
                        <button className="pressable min-h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700" onClick={() => startEdit(device)} type="button">{t.edit}</button>
                      </div>
                      <p className="text-xs font-bold text-stone-600">{t.mode}: <span className="text-stone-900">{device.mode}</span></p>
                      <p className="text-xs font-bold text-stone-600">{t.lastOnline}: <span className="text-stone-900">{lastSeen ?? t.never}</span></p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
        {saveError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">{saveError}</p> : null}
      </div>
    </SettingsCard>
  );
}
