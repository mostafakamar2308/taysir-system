"use client";

import { useTranslations } from "next-intl";
import { utcToLocalDate } from "@/lib/dates";
import { AdminSessionClientData } from "@/types/session";
import { SessionCard } from "@/components/dashboard/sessions/sessionCard";

const timeSlots = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

type WeekViewProps = {
  weekDates: Date[];
  sessions: AdminSessionClientData[];
  onSlotClick: (date: Date, hour: number) => void;
  onSessionClick: (session: AdminSessionClientData) => void;
};

export function WeekView({
  weekDates,
  sessions,
  onSlotClick,
  onSessionClick,
}: WeekViewProps) {
  const t = useTranslations("TutorSessions");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayNamesShort = [
    t("daySat"),
    t("daySun"),
    t("dayMon"),
    t("dayTue"),
    t("dayWed"),
    t("dayThu"),
    t("dayFri"),
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-175">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,minmax(100px,1fr))] border-b border-border">
            <div className="p-2" />
            {weekDates.map((date, i) => {
              const isToday = utcToLocalDate(date) === utcToLocalDate(today);
              return (
                <div
                  key={i}
                  className={`p-3 text-center border-r border-border ${isToday ? "bg-primary/5" : ""}`}
                >
                  <p className="text-xs text-muted-foreground">
                    {dayNamesShort[i]}
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
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className="grid grid-cols-[60px_repeat(7,minmax(100px,1fr))] border-b border-border last:border-b-0"
              >
                <div className="p-2 text-xs text-muted-foreground text-center border-l border-border flex items-start justify-center pt-1">
                  {slot.label}
                </div>
                {weekDates.map((date, dayIdx) => {
                  const cellSessions = sessions.filter((s) => {
                    const d = new Date(s.startTime);
                    return (
                      d.getDate() === date.getDate() &&
                      d.getMonth() === date.getMonth() &&
                      d.getHours() === slot.hour
                    );
                  });
                  const isToday =
                    utcToLocalDate(date) === utcToLocalDate(today);
                  const isPast =
                    date < today ||
                    (isToday && slot.hour < new Date().getHours());

                  return (
                    <div
                      key={dayIdx}
                      className={`p-1 border-r border-border cursor-pointer hover:bg-accent/30 transition-colors relative min-h-16 min-w-0 ${
                        isToday ? "bg-primary/2" : ""
                      } ${isPast ? "opacity-80" : ""}`}
                      onClick={() =>
                        cellSessions.length === 0 &&
                        onSlotClick(date, slot.hour)
                      }
                    >
                      <div className="flex flex-col gap-0.5 h-full w-full overflow-hidden">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
