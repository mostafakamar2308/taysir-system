import dayjs from "@/lib/dayjs";

export function localToUTC(date: string, time: string): Date {
  return dayjs
    .tz(`${date}T${time}`, "YYYY-MM-DDTHH:mm", dayjs.tz.guess())
    .utc()
    .toDate();
}

// Convert a UTC Date to a local date string (YYYY-MM-DD)
export function utcToLocalDate(utcDate: Date): string {
  return dayjs.utc(utcDate).local().format("YYYY-MM-DD");
}

// Convert a UTC Date to a local time string (HH:mm)
export function utcToLocalTime(utcDate: Date): string {
  return dayjs.utc(utcDate).local().format("HH:mm");
}

// Format a UTC Date for display (e.g., "الإثنين 15 مارس 2025")
export function formatDateArabic(utcDate: Date): string {
  return dayjs.utc(utcDate).local().locale("ar").format("dddd D MMMM YYYY");
}

// Get the week dates (Sunday to Saturday) for a given date (in local time)
export function getWeekDates(refDate: Date): Date[] {
  const d = dayjs(refDate).startOf("week"); // Sunday
  return Array.from({ length: 7 }, (_, i) => d.add(i, "day").toDate());
}

// Format date in Arabic (e.g., "15 مارس 2026")
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dayjs.utc(d).local().locale("ar").format("D MMMM YYYY");
}

// Format time in Arabic with AM/PM (e.g., "10:30 ص")
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dayjs.utc(d).local().locale("ar").format("h:mm A");
}
