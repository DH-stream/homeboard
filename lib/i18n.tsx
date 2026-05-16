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
    allPeople: "All people",
    anyone: "Anyone",
    apiTaskState: "API task state",
    app: "App",
    appEyebrow: "Mobile HomeBoard",
    appTitle: "Today",
    browserLocalStorage: "Browser localStorage",
    calendarMock: "Calendar is still demo/mock data.",
    calendarSources: "Calendar sources",
    calendarSourcesCopy: "Calendar cards already consume `CalendarEvent` data through a service. Google, Outlook, CalDAV, and ICS sync should be added as read-only source adapters.",
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
    futureSchedulingPreview: "Future scheduled tasks stay local for now and are shown as upcoming.",
    homeAssistantIntegration: "Home Assistant integration",
    homeAssistantIntegrationCopy: "Home Assistant will be an integration layer for display, status, REST/MQTT/webhook automation, and Lovelace embedding—not the primary HomeBoard database.",
    household: "Household",
    householdCopy: "Demo household metadata is loaded through the member repository. Future setup will support household invites, timezone, locale, and shared preferences.",
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
    open: "Open",
    openWall: "Open wall",
    planned: "Planned",
    previewMode: "Preview mode",
    previewStatus: "Preview status",
    previewStorage: "Preview storage",
    progressComplete: "tasks complete",
    remaining: "remaining",
    runaiApiTokens: "RUNAI / API tokens",
    runaiApiTokensCopy: "Task source types and `/api/tasks` are prepared for API clients. Token-scoped auth, audit trails, and an OpenAPI contract are next-step work.",
    save: "Save",
    selectedLanguage: "Selected language",
    settings: "Settings",
    settingsDescription: "Household, members, integrations, API tokens, and backend status.",
    settingsEyebrow: "Setup",
    storageClarification: "API writes from future RUNAI or Home Assistant clients do not yet appear in the wall/mobile UI. This is expected during the local preview and will be connected in the shared backend step.",
    syncNotConnected: "Sync is not connected yet",
    taskCompleteLabel: "Mark task complete",
    taskIncompleteLabel: "Mark task incomplete",
    tasks: "Tasks",
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
    more: "more",
    time: "Time",
    whatNeedsDoing: "What needs doing today?",
  },
  sv: {
    addTask: "Lägg till uppgift",
    addToToday: "Lägg till i dag",
    adding: "Lägger till…",
    all: "Alla",
    allPeople: "Alla",
    anyone: "Vem som helst",
    apiTaskState: "API-uppgifter",
    app: "App",
    appEyebrow: "Mobil HomeBoard",
    appTitle: "I dag",
    browserLocalStorage: "Webbläsarens localStorage",
    calendarMock: "Kalendern är fortfarande demo/mock-data.",
    calendarSources: "Kalenderkällor",
    calendarSourcesCopy: "Kalenderkorten använder redan `CalendarEvent`-data via en service. Google, Outlook, CalDAV och ICS bör läggas till som skrivskyddade källor.",
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
    futureSchedulingPreview: "Framtida uppgifter sparas lokalt och visas som kommande.",
    homeAssistantIntegration: "Home Assistant-integration",
    homeAssistantIntegrationCopy: "Home Assistant blir ett integrationslager för visning, status, REST/MQTT/webhook-automation och Lovelace-inbäddning – inte HomeBoards primära databas.",
    household: "Hushåll",
    householdCopy: "Demo-metadata för hushållet läses via medlemslagret. Framtida setup kommer stödja inbjudningar, tidszon, språk och delade inställningar.",
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
    open: "Öppna",
    openWall: "Öppna väggvy",
    planned: "Planerad",
    previewMode: "Förhandsläge",
    previewStatus: "Förhandsstatus",
    previewStorage: "Lokal lagring",
    progressComplete: "klara",
    remaining: "kvar",
    runaiApiTokens: "RUNAI / API-tokens",
    runaiApiTokensCopy: "Uppgiftskällor och `/api/tasks` är förberedda för API-klienter. Tokenbaserad auth, audit loggar och ett OpenAPI-kontrakt är nästa steg.",
    save: "Spara",
    selectedLanguage: "Valt språk",
    settings: "Inställningar",
    settingsDescription: "Hushåll, medlemmar, integrationer, API-tokens och backendstatus.",
    settingsEyebrow: "Setup",
    storageClarification: "API-skrivningar från framtida RUNAI- eller Home Assistant-klienter visas ännu inte i vägg- eller mobilvyn. Det är väntat i lokal förhandsvisning och kopplas ihop i steget för delad backend.",
    syncNotConnected: "Synk ej ansluten",
    taskCompleteLabel: "Markera uppgift som klar",
    taskIncompleteLabel: "Markera uppgift som inte klar",
    tasks: "Uppgifter",
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
    more: "till",
    time: "Tid",
    whatNeedsDoing: "Vad behöver göras i dag?",
  },
} as const;

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
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

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

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languageName: languageNames[language],
      setLanguage,
      t: (key) => translations[language][key],
    }),
    [language, setLanguage],
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
