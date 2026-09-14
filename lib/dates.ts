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

// Get the Saturday (start of the academy week) that contains the given date.
// Locale-independent: app convention maps JS day() to 0=Saturday..6=Friday via
// appDay = (day + 1) % 7, so subtract appDay days to reach that week's Saturday.
export function saturdayOfWeek(date?: dayjs.ConfigType): string {
  const d = dayjs(date ?? new Date());
  const offset = (d.day() + 1) % 7; // 0=Saturday, 1=Sunday, ..., 6=Friday
  return d.subtract(offset, "day").format("YYYY-MM-DD");
}

// Get the week dates (Saturday to Friday) for a given date (in local time)
export function getWeekDates(refDate: Date): Date[] {
  const d = dayjs(saturdayOfWeek(refDate));
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
