"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "sv";

type TranslationKey = keyof typeof translations.en;

const LANGUAGE_STORAGE_KEY = "homeboard.language.v1";

const translations = {
  en: {
    addTask: "Add task",
    addToToday: "Add to today",
    adding: "Adding…",
    all: "All",
    addTime: "Add time",
    allPeople: "All people",
    anyone: "Anyone",
    apiTaskState: "API task state",
    app: "App",
    appEyebrow: "Mobile HomeBoard",
    appTitle: "Today",
    browserLocalStorage: "Browser localStorage",
    calendarMock: "Calendar source selection is Supabase-ready and setup-gated.",
    cancel: "Cancel",
    calendarSources: "Calendar sources",
    calendarSourcesCopy: "Choose which Supabase-backed calendar sources appear on the wall and mobile agenda. Enabled sources merge into one household calendar.",
    calendarNoConnectionsBody: "Calendar provider login will be added next. Sources will appear here after connecting Google, Microsoft, iCloud, or ICS.",
    calendarNoConnectionsTitle: "No calendars connected yet.",
    calendarSetupBody: "Add Supabase env vars and run the database migration to enable calendar source selection.",
    calendarSetupHouseholdBody: "Create or select a household on this device. NEXT_PUBLIC_HOMEBOARD_HOUSEHOLD_ID remains an optional development override.",
    calendarSetupTitle: "Calendar sync is not configured yet.",
    clearDueDate: "No date yet",
    completed: "Completed",
    dataBackendStatus: "Data / backend status",
    displayDeviceSettings: "Display / device settings",
    displayDeviceSettingsCopy: "Device types are modeled for wall, mobile, and admin modes. Future settings can manage default route, sleep schedule, brightness, and kiosk behavior.",
    done: "Done",
    dueDate: "Due date",
    dueDatePreview: "One-off due dates are stored only in this local preview for now.",
    edit: "Edit",
    events: "events",
    filtersCompleted: "Completed",
    filtersOpen: "Open",
    futureSchedulingPreview: "Future scheduled tasks are shown as upcoming.",
    homeAssistantIntegration: "Home Assistant integration",
    homeAssistantIntegrationCopy: "Home Assistant will be an integration layer for display, status, REST/MQTT/webhook automation, and Lovelace embedding—not the primary HomeBoard database.",
    household: "Household",
    householdCopy: "This device resolves the household from an optional development override first, then the locally selected household id. Future setup will add invites, timezone, locale, and shared preferences.",
    landingDescription: "A calm wall calendar and shared task dashboard with local preview persistence today, plus clean seams for Supabase/Postgres, Home Assistant, and RUNAI later.",
    landingEyebrow: "Self-hostable family dashboard",
    landingTitle: "HomeBoard keeps the whole household in sync.",
    language: "Language",
    languageCopy: "Choose the language for HomeBoard on this device. The setting is stored in localStorage for the preview.",
    left: "left",
    localPreview: "Local preview",
    manageTasks: "Manage tasks",
    members: "Members",
    membersCopy: "Member names, colors, and roles are represented in shared types and mock repository data. Editing and invitations are planned after durable auth and storage.",
    mobileApp: "Mobile app",
    mobileAppDescription: "Phone-first task management, add-task flow, filters, and calendar preview.",
    mock: "Mock",
    multiDeviceSync: "Multi-device sync",
    nextBackendTarget: "Next backend target",
    niceWork: "Nice work!",
    noCloudSync: "Storage mode: Local preview — no cloud sync yet.",
    noMultiDeviceSync: "No multi-device sync yet.",
    noTasks: "No tasks for today.",
    noTasksBody: "Add a task from the mobile app view to start the household plan.",
    notConnectedYet: "Not connected yet",
    nothingScheduled: "Nothing scheduled today.",
    nothingScheduledBody: "Enjoy the open space, or connect calendar sync in a future backend pass.",
    off: "Off",
    on: "On",
    open: "Open",
    openWall: "Open wall",
    planned: "Planned",
    previewMode: "Preview mode",
    previewStatus: "Preview status",
    previewStorage: "Preview storage",
    progressComplete: "tasks complete",
    remaining: "remaining",
    readOnly: "Read-only",
    runaiApiTokens: "RUNAI / API tokens",
    runaiApiTokensCopy: "Task source types and `/api/tasks` are prepared for API clients. Token-scoped auth, audit trails, and an OpenAPI contract are next-step work.",
    save: "Save",
    selectedLanguage: "Selected language",
    settings: "Settings",
    settingsDescription: "Household, members, integrations, API tokens, and backend status.",
    settingsEyebrow: "Setup",
    storageClarification: "API writes from future RUNAI or Home Assistant clients do not yet appear in the wall/mobile UI. This is expected during the local preview and will be connected in the shared backend step.",
    supabaseReady: "Supabase-ready",
    syncNotConnected: "Sync is not connected yet",
    taskCompleteLabel: "Mark task complete",
    supabaseHouseholdSync: "Household sync",
    supabaseTaskDueDatePreview: "One-off due dates are synced for this household.",
    taskIncompleteLabel: "Mark task incomplete",
    tasks: "Tasks",
    tasksSyncError: "Tasks could not sync right now. Try again in a moment.",
    tasksLabel: "Tasks",
    temporaryInMemory: "Temporary in-memory",
    todayAgenda: "Today’s agenda",
    todaysProgress: "Today’s progress",
    todaysTasks: "Today’s tasks",
    touchToCheckOff: "Touch to check off",
    uiTaskState: "UI task state",
    upcoming: "Upcoming",
    upcomingEmpty: "Scheduled tasks for later will appear here.",
    wall: "Wall",
    wallDashboard: "Wall dashboard",
    wallDashboardDescription: "Landscape family hub for today’s schedule and touch-friendly task completion.",
    weekPreview: "Week preview",
    markComplete: "Mark complete",
    markFutureTaskCompleteBody: "This task is planned for later. Do you want to mark it complete now?",
    markFutureTaskCompleteTitle: "Mark future task complete?",
    more: "more",
    oneOff: "One-off",
    repeats: "Repeats",
    removeTime: "Remove time",
    time: "Time",
    times: "Times",
    weekdays: "Weekdays",
    weekly: "Weekly",
    daily: "Daily",
    whatNeedsDoing: "What needs doing today?",
  },
  sv: {
    addTask: "Lägg till uppgift",
    addToToday: "Lägg till i dag",
    adding: "Lägger till…",
    all: "Allt",
    addTime: "Lägg till tid",
    allPeople: "Alla",
    anyone: "Vem som helst",
    apiTaskState: "API-uppgifter",
    app: "App",
    appEyebrow: "Mobil HomeBoard",
    appTitle: "I dag",
    browserLocalStorage: "Webbläsarens localStorage",
    calendarMock: "Val av kalenderkällor är Supabase-förberett och kräver setup.",
    cancel: "Avbryt",
    calendarSources: "Kalenderkällor",
    calendarSourcesCopy: "Välj vilka Supabase-kalenderkällor som visas i vägg- och mobilagendan. Aktiva källor slås ihop till en hushållskalender.",
    calendarNoConnectionsBody: "Kalenderinloggning läggs till härnäst. Källor visas här efter anslutning av Google, Microsoft, iCloud eller ICS.",
    calendarNoConnectionsTitle: "Inga kalendrar är anslutna ännu.",
    calendarSetupBody: "Lägg till Supabase-miljövariabler och kör databasmigreringen för att aktivera val av kalenderkällor.",
    calendarSetupHouseholdBody: "Skapa eller välj ett hushåll på den här enheten. NEXT_PUBLIC_HOMEBOARD_HOUSEHOLD_ID är fortfarande en valfri utvecklingsoverride.",
    calendarSetupTitle: "Kalendersynk är inte konfigurerad ännu.",
    clearDueDate: "Inget datum än",
    completed: "Klart",
    dataBackendStatus: "Data / backendstatus",
    displayDeviceSettings: "Skärm- och enhetsinställningar",
    displayDeviceSettingsCopy: "Enhetstyper finns modellerade för vägg, mobil och admin. Framtida inställningar kan hantera standardvy, sovschema, ljusstyrka och kioskläge.",
    done: "Klart",
    dueDate: "Datum",
    dueDatePreview: "Engångsdatum sparas bara i lokal preview just nu.",
    edit: "Ändra",
    events: "händelser",
    filtersCompleted: "Klart",
    filtersOpen: "Kvar",
    futureSchedulingPreview: "Framtida uppgifter visas som kommande.",
    homeAssistantIntegration: "Home Assistant-integration",
    homeAssistantIntegrationCopy: "Home Assistant blir ett integrationslager för visning, status, REST/MQTT/webhook-automation och Lovelace-inbäddning – inte HomeBoards primära databas.",
    household: "Hushåll",
    householdCopy: "Den här enheten hämtar hushållet från en valfri utvecklingsoverride först och sedan det lokalt valda hushålls-id:t. Framtida setup lägger till inbjudningar, tidszon, språk och delade inställningar.",
    landingDescription: "En lugn väggkalender och gemensam uppgiftstavla med lokal förhandsvisning i dag, plus tydliga vägar till Supabase/Postgres, Home Assistant och RUNAI senare.",
    landingEyebrow: "Självhostad familjetavla",
    landingTitle: "HomeBoard håller hela hushållet i synk.",
    language: "Språk",
    languageCopy: "Välj språk för HomeBoard på den här enheten. Inställningen sparas i localStorage i förhandsvisningen.",
    left: "kvar",
    localPreview: "Lokal vy",
    manageTasks: "Hantera uppgifter",
    members: "Medlemmar",
    membersCopy: "Namn, färger och roller för medlemmar finns i gemensamma typer och mock-data. Redigering och inbjudningar planeras efter hållbar auth och lagring.",
    mobileApp: "Mobilvy",
    mobileAppDescription: "Mobil först: uppgifter, lägg-till-flöde, filter och kalenderförhandsvisning.",
    mock: "Mock",
    multiDeviceSync: "Enhetssynk",
    nextBackendTarget: "Nästa backend-mål",
    niceWork: "Bra jobbat!",
    noCloudSync: "Lagring: Lokal preview — ingen molnsynk ännu.",
    noMultiDeviceSync: "Ingen synk mellan enheter ännu.",
    noTasks: "Inga uppgifter för i dag.",
    noTasksBody: "Lägg till en uppgift i mobilvyn för att starta hushållets plan.",
    notConnectedYet: "Inte ansluten ännu",
    nothingScheduled: "Inget planerat i dag.",
    nothingScheduledBody: "Njut av lugnet, eller koppla kalender-synk i ett framtida backend-steg.",
    off: "Av",
    on: "På",
    open: "Öppna",
    openWall: "Öppna väggvy",
    planned: "Planerad",
    previewMode: "Förhandsläge",
    previewStatus: "Förhandsstatus",
    previewStorage: "Lokal lagring",
    progressComplete: "klara",
    remaining: "kvar",
    readOnly: "Skrivskyddad",
    runaiApiTokens: "RUNAI / API-tokens",
    runaiApiTokensCopy: "Uppgiftskällor och `/api/tasks` är förberedda för API-klienter. Tokenbaserad auth, audit loggar och ett OpenAPI-kontrakt är nästa steg.",
    save: "Spara",
    selectedLanguage: "Valt språk",
    settings: "Inställningar",
    settingsDescription: "Hushåll, medlemmar, integrationer, API-tokens och backendstatus.",
    settingsEyebrow: "Setup",
    storageClarification: "API-skrivningar från framtida RUNAI- eller Home Assistant-klienter visas ännu inte i vägg- eller mobilvyn. Det är väntat i lokal förhandsvisning och kopplas ihop i steget för delad backend.",
    supabaseReady: "Supabase klar",
    syncNotConnected: "Synk ej ansluten",
    taskCompleteLabel: "Markera uppgift som klar",
    supabaseHouseholdSync: "Hushållssynk",
    supabaseTaskDueDatePreview: "Engångsdatum synkas för det här hushållet.",
    taskIncompleteLabel: "Markera uppgift som inte klar",
    tasks: "Uppgifter",
    tasksSyncError: "Uppgifter kunde inte synkas just nu. Försök igen om en stund.",
    tasksLabel: "Uppgifter",
    temporaryInMemory: "Tillfällig i minnet",
    todayAgenda: "Dagens agenda",
    todaysProgress: "Dagens läge",
    todaysTasks: "Dagens uppgifter",
    touchToCheckOff: "Tryck för klart",
    uiTaskState: "UI-uppgifter",
    upcoming: "Kommande",
    upcomingEmpty: "Uppgifter för senare visas här.",
    wall: "Vägg",
    wallDashboard: "Väggvy",
    wallDashboardDescription: "Landskapsvy för familjens schema i dag och tydlig uppgiftsavbockning.",
    weekPreview: "Veckovy",
    markComplete: "Markera som klar",
    markFutureTaskCompleteBody: "Den här uppgiften är planerad till senare. Vill du markera den som klar redan nu?",
    markFutureTaskCompleteTitle: "Markera framtida uppgift som klar?",
    more: "till",
    oneOff: "Engångs",
    repeats: "Upprepas",
    removeTime: "Ta bort tid",
    time: "Tid",
    times: "Tider",
    weekdays: "Veckodagar",
    weekly: "Varje vecka",
    daily: "Dagligen",
    whatNeedsDoing: "Vad behöver göras i dag?",
  },
} as const;

const completionEncouragements: Record<Language, string[]> = {
  en: [
    "Nice work!",
    "That’s one done!",
    "Small win secured!",
    "You’re on a roll!",
    "Love that progress!",
    "Done and dusted!",
    "That helped the home!",
    "One less thing!",
    "Beautifully done!",
    "Keep it moving!",
  ],
  sv: [
    "Bra jobbat!",
    "Snyggt fixat!",
    "En sak mindre!",
    "Det där satt!",
    "Du är igång!",
    "Fint avbockat!",
    "Hemmet tackar!",
    "Stabilt!",
    "Riktigt snyggt!",
    "Mer kontroll!",
  ],
};

const languageNames: Record<Language, string> = {
  en: "English",
  sv: "Svenska",
};

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "sv";
}

type LanguageContextValue = {
  language: Language;
  languageName: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  getCompletionEncouragement: (previous?: string | null) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function pickCompletionEncouragement(language: Language, previous?: string | null) {
  const messages = completionEncouragements[language];
  if (messages.length <= 1) return messages[0] ?? translations[language].niceWork;

  const candidates = previous ? messages.filter((message) => message !== previous) : messages;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? messages[0];
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const getCompletionEncouragement = useCallback(
    (previous?: string | null) => pickCompletionEncouragement(language, previous),
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languageName: languageNames[language],
      setLanguage,
      t: (key) => translations[language][key],
      getCompletionEncouragement,
    }),
    [getCompletionEncouragement, language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}

export function getLocale(language: Language) {
  return language === "sv" ? "sv-SE" : "en-US";
}
