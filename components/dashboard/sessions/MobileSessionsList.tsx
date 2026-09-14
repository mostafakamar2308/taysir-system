"use client";

import dayjs from "@/lib/dayjs";
import type { AdminSession, RecurringScheduleSlot } from "@/types/session";
import { SessionCard } from "./SessionCard";
import { Badge } from "@/components/ui/badge";
import { Repeat } from "lucide-react";

interface Props {
  weekDates: Date[];
  sessions: AdminSession[];
  recurringSlots?: RecurringScheduleSlot[];
  onSessionClick: (session: AdminSession) => void;
  onEditSession?: (session: AdminSession) => void;
  onCancelSession?: (session: AdminSession) => void;
  onExtendSession?: (session: AdminSession) => void;
  onRecurringSlotClick?: (slot: RecurringScheduleSlot) => void;
}

const dayNames = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

export function MobileSessionsList({
  weekDates,
  sessions,
  recurringSlots = [],
  onSessionClick,
  onEditSession,
  onCancelSession,
  onExtendSession,
  onRecurringSlotClick,
}: Props) {
  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className="space-y-4">
      {weekDates.map((date, idx) => {
        const dayKey = dayjs(date).format("YYYY-MM-DD");
        const isToday = dayKey === today;
        const daySessions = sessions.filter(
          (s) => dayjs(s.startTime).format("YYYY-MM-DD") === dayKey,
        );
        const dayRecurringSlots = recurringSlots.filter(
          (slot) => slot.nextOccurrence === dayKey,
        );
        if (daySessions.length === 0 && dayRecurringSlots.length === 0)
          return null;

        return (
          <div key={idx}>
            <div
              className={`flex items-center gap-2 mb-2 ${isToday ? "text-primary font-bold" : ""}`}
            >
              <span>{dayNames[idx]}</span>
              <span className="text-lg">{date.getDate()}</span>
            </div>
            <div className="space-y-2">
              {daySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => onSessionClick(session)}
                  onEdit={onEditSession}
                  onCancel={onCancelSession}
                  onExtend={onExtendSession}
                />
              ))}
              {dayRecurringSlots.map((slot) => (
                <button
                  key={`recurring-${slot.id}-${slot.nextOccurrence}`}
                  onClick={() => onRecurringSlotClick?.(slot)}
                  className="w-full text-right rounded-lg p-2 border-2 border-dashed border-muted-foreground/30 bg-muted/30 opacity-70 transition-all hover:opacity-100 hover:shadow-md"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {slot.startTime} –{" "}
                      {dayjs(`${slot.nextOccurrence}T${slot.startTime}`)
                        .add(slot.durationMinutes, "minute")
                        .format("HH:mm")}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 bg-violet-100 text-violet-700 border-violet-200"
                    >
                      <Repeat className="h-2.5 w-2.5 ml-0.5" />
                      متكرر
                    </Badge>
                  </div>
                  <p className="text-xs mt-1 truncate text-muted-foreground">
                    {slot.tutorName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {slot.groupName}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}