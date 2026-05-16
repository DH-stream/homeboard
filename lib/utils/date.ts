export function toLocalDateKey(date: Date | string = new Date()) {
  const value = typeof date === "string" ? new Date(date) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const toDateKey = toLocalDateKey;

export function atLocalTime(hours: number, minutes = 0, date = new Date()) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
}

export function formatTime(value: string, locale?: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortDate(value: string | Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getWeekDays(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

export function isValidDateValue(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}


export function formatTaskDate(value: string, locale?: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function isSameLocalDay(a: Date | string, b: Date | string = new Date()) {
  return toLocalDateKey(a) === toLocalDateKey(b);
}

export function isFutureLocalDay(value: Date | string, today: Date | string = new Date()) {
  return toLocalDateKey(value) > toLocalDateKey(today);
}
