"use client";

import { utcToLocalDate } from "@/lib/dates";
import { SessionCard } from "@/components/dashboard/sessions/sessionCard";
import { AdminSessionClientData } from "@/types/session";

const timeSlots = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

type DayViewProps = {
  date: Date;
  sessions: AdminSessionClientData[];
  onSlotClick: (date: Date, hour: number) => void;
  onSessionClick: (session: AdminSessionClientData) => void;
};

export function DayView({
  date,
  sessions,
  onSlotClick,
  onSessionClick,
}: DayViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = utcToLocalDate(date) === utcToLocalDate(today);
  const dayOfWeek = new Date(date).toLocaleDateString("ar-EG", {
    weekday: "long",
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[60px_1fr] border-b border-border">
        <div className="p-2" />
        <div className={`p-3 text-center ${isToday ? "bg-primary/5" : ""}`}>
          <p className="text-xs text-muted-foreground">{dayOfWeek}</p>
          <p
            className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}
          >
            {date.getDate()}
          </p>
        </div>
      </div>
      <div className="max-h-150 overflow-y-auto">
        {timeSlots.map((slot) => {
          const cellSessions = sessions.filter((s) => {
            const d = new Date(s.startTime);
            return (
              d.getDate() === date.getDate() &&
              d.getMonth() === date.getMonth() &&
              d.getHours() === slot.hour
            );
          });
          const isPast =
            date < today || (isToday && slot.hour < new Date().getHours());

          return (
            <div
              key={slot.hour}
              className="grid grid-cols-[60px_1fr] border-b border-border last:border-b-0 min-h-16"
            >
              <div className="p-2 text-xs text-muted-foreground text-center border-l border-border flex items-start justify-center pt-1">
                {slot.label}
              </div>
              <div
                className={`p-1 border-r border-border cursor-pointer hover:bg-accent/30 transition-colors relative ${
                  isToday ? "bg-primary/2" : ""
                } ${isPast ? "opacity-80" : ""}`}
                onClick={() =>
                  cellSessions.length === 0 && onSlotClick(date, slot.hour)
                }
              >
                {cellSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => onSessionClick(session)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
