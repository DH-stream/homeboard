import type { CalendarEvent } from "@/types";
import { atLocalTime, getWeekDays } from "@/lib/utils/date";

const week = getWeekDays();
const isoOnDay = (dayIndex: number, hour: number, minute = 0) => {
  const day = week[dayIndex] ?? new Date();
  return atLocalTime(hour, minute, day);
};

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "event-school-dropoff",
    householdId: "household-demo",
    sourceId: "demo-family-calendar",
    title: "School drop-off",
    location: "North entrance",
    startAt: atLocalTime(8, 15),
    endAt: atLocalTime(8, 35),
    allDay: false,
    color: "#f97316",
    sourceType: "ics",
    externalId: "demo-school-dropoff",
  },
  {
    id: "event-dentist",
    householdId: "household-demo",
    sourceId: "demo-family-calendar",
    title: "Dentist appointment",
    location: "Main Street Dental",
    startAt: atLocalTime(11, 0),
    endAt: atLocalTime(12, 0),
    allDay: false,
    color: "#8b5cf6",
    sourceType: "google",
    externalId: "demo-dentist",
  },
  {
    id: "event-soccer",
    householdId: "household-demo",
    sourceId: "demo-family-calendar",
    title: "Soccer practice",
    location: "Community field",
    startAt: atLocalTime(17, 30),
    endAt: atLocalTime(18, 45),
    allDay: false,
    color: "#14b8a6",
    sourceType: "outlook",
    externalId: "demo-soccer",
  },
  {
    id: "event-grocery",
    householdId: "household-demo",
    sourceId: "demo-family-calendar",
    title: "Grocery pickup window",
    startAt: isoOnDay(5, 10, 0),
    endAt: isoOnDay(5, 11, 0),
    allDay: false,
    color: "#0ea5e9",
    sourceType: "manual",
  },
  {
    id: "event-family-movie",
    householdId: "household-demo",
    sourceId: "demo-family-calendar",
    title: "Family movie night",
    startAt: isoOnDay(6, 19, 0),
    endAt: isoOnDay(6, 21, 0),
    allDay: false,
    color: "#ec4899",
    sourceType: "ics",
  },
];
