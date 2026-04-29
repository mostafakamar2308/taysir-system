"use client";

import { DashboardSession } from "@/types/session";
import { WeekView } from "@/components/dashboard/sessions/views/weekView";
import { getWeekDates } from "@/lib/dates";
import dayjs from "@/lib/dayjs";

interface CalendarViewProps {
    currentWeekStart: string;
    sessions: DashboardSession[];
    onSlotClick: () => void;
    onSessionClick: (session: DashboardSession) => void;
    onMarkAttendance: () => void;
}

export default function CalendarView({
    currentWeekStart,
    sessions,
    onSlotClick,
    onSessionClick,
    onMarkAttendance,
}: CalendarViewProps) {
    const weekDates = getWeekDates(dayjs(currentWeekStart).toDate());

    return (
        <WeekView
            weekDates={weekDates}
            sessions={sessions}
            onSlotClick={onSlotClick}
            onSessionClick={onSessionClick}
            onMarkAttendance={onMarkAttendance}
        />
    );
}