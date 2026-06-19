"use client";

import { WeekView } from "@/components/dashboard/sessions/views/weekView";
import { getWeekDates } from "@/lib/dates";
import dayjs from "@/lib/dayjs";
import { AdminSessionClientData } from "@/types/session";

interface CalendarViewProps {
  currentWeekStart: string;
  sessions: AdminSessionClientData[];
  onSlotClick: () => void;
  onSessionClick: (session: AdminSessionClientData) => void;
}

export default function CalendarView({
  currentWeekStart,
  sessions,
  onSlotClick,
  onSessionClick,
}: CalendarViewProps) {
  const weekDates = getWeekDates(dayjs(currentWeekStart).toDate());

  return (
    <WeekView
      weekDates={weekDates}
      sessions={sessions}
      onSlotClick={onSlotClick}
      onSessionClick={onSessionClick}
    />
  );
}
