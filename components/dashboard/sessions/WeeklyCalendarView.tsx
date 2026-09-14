"use client";

import { useMemo } from "react";
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
  onEditSession: (session: AdminSession) => void;
  onCancelSession: (session: AdminSession) => void;
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
const hours = Array.from({ length: 24 }, (_, i) => i); // 0–23

export function WeeklyCalendarView({
  weekDates,
  sessions,
  recurringSlots = [],
  onSessionClick,
  onEditSession,
  onCancelSession,
  onExtendSession,
  onRecurringSlotClick,
}: Props) {
  // Group sessions by day AND start hour for quick lookup
  const sessionsByDayHour = useMemo(() => {
    const map = new Map<string, AdminSession[]>();
    for (const date of weekDates) {
      const dayKey = dayjs(date).format("YYYY-MM-DD");
      // Pre‑create entries for every hour of that day
      for (let h = 0; h < 24; h++) {
        map.set(`${dayKey}-${h}`, []);
      }
    }
    for (const session of sessions) {
      const start = dayjs(session.startTime);
      const dayKey = start.format("YYYY-MM-DD");
      const hour = start.hour();
      const key = `${dayKey}-${hour}`;
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(session);
      }
    }
    // Sort each bucket by start time
    for (const [, bucket] of map) {
      bucket.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [sessions, weekDates]);

  // Group recurring slots by day/hour too
  const recurringSlotsByDayHour = useMemo(() => {
    const map = new Map<string, RecurringScheduleSlot[]>();
    for (const slot of recurringSlots) {
      const [h, m] = slot.startTime.split(":").map(Number);
      const key = `${slot.nextOccurrence}-${h}`;
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(slot);
      } else {
        map.set(key, [slot]);
      }
    }
    return map;
  }, [recurringSlots]);

  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,minmax(100px,1fr))] border-b border-border">
            <div className="p-2" />
            {weekDates.map((date, idx) => {
              const dateStr = dayjs(date).format("YYYY-MM-DD");
              const isToday = dateStr === today;
              return (
                <div
                  key={idx}
                  className={`p-3 text-center border-r border-border ${isToday ? "bg-primary/5" : ""}`}
                >
                  <p className="text-xs text-muted-foreground">
                    {dayNames[idx]}
                  </p>
                  <p
                    className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}
                  >
                    {date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[60px_repeat(7,minmax(100px,1fr))] border-b border-border last:border-b-0"
              >
                <div className="p-2 text-xs text-muted-foreground text-center border-l border-border flex items-start justify-center pt-1">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </div>
                {weekDates.map((date, dayIdx) => {
                  const dayKey = dayjs(date).format("YYYY-MM-DD");
                  const isToday = dayKey === today;
                  const isPast =
                    dayjs(date).isBefore(today) ||
                    (isToday && hour < dayjs().hour());
                  const cellSessions =
                    sessionsByDayHour.get(`${dayKey}-${hour}`) ?? [];
                  const cellRecurringSlots =
                    recurringSlotsByDayHour.get(`${dayKey}-${hour}`) ?? [];

                  return (
                    <div
                      key={dayIdx}
                      className={`p-1 border-r border-border cursor-pointer hover:bg-accent/30 transition-colors relative min-h-16 min-w-0 ${
                        isToday ? "bg-primary/2" : ""
                      } ${isPast ? "opacity-80" : ""}`}
                      // onClick for empty slot click not implemented here – could add later
                    >
                      <div className="flex flex-col gap-0.5 h-full w-full overflow-hidden">
                        {cellSessions.map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            onClick={() => onSessionClick(session)}
                            onEdit={onEditSession}
                            onCancel={onCancelSession}
                            onExtend={onExtendSession}
                          />
                        ))}
                        {cellRecurringSlots.map((slot) => (
                          <button
                            key={`recurring-${slot.id}-${slot.nextOccurrence}`}
                            onClick={() => onRecurringSlotClick?.(slot)}
                            className="w-full text-right rounded-lg p-2 border-2 border-dashed border-muted-foreground/30 bg-muted/30 opacity-70 transition-all hover:opacity-100 hover:shadow-md text-left"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {slot.startTime} –{" "}
                                {dayjs(
                                  `${slot.nextOccurrence}T${slot.startTime}`,
                                )
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
