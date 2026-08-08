import dayjs from "@/lib/dayjs";
import type { TutorPeriod, TutorPeriodPreset } from "@/types/tutorFinances";

export function getTutorPeriodRange(
  preset: TutorPeriodPreset,
  now: Date = new Date(),
): TutorPeriod {
  const base = dayjs.utc(now);
  if (preset === "prevMonth") {
    const m = base.subtract(1, "month");
    return {
      preset,
      from: m.startOf("month").toDate(),
      to: m.endOf("month").toDate(),
    };
  }
  if (preset === "custom") {
    return { preset, from: base.startOf("month").toDate(), to: base.endOf("month").toDate() };
  }
  return {
    preset: "currentMonth",
    from: base.startOf("month").toDate(),
    to: base.endOf("month").toDate(),
  };
}

export function monthLabel(month: string): string {
  return dayjs.utc(`${month}-01`).format("MMMM YYYY");
}
