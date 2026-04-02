import { utcToLocalDate } from "@/lib/dates";
import { SessionCard } from "@/components/dashboard/sessions/sessionCard";
import { DashboardSession } from "@/types/session";

const timeSlots = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));
const dayNamesShort = [
  "سبت",
  "أحد",
  "اثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
];

type WeekViewProps = {
  weekDates: Date[];
  sessions: DashboardSession[];
  onSlotClick: (date: Date, hour: number) => void;
  onSessionClick: (session: DashboardSession) => void;
  onMarkAttendance: (session: DashboardSession) => void;
};

export function WeekView({
  weekDates,
  sessions,
  onSlotClick,
  onSessionClick,
  onMarkAttendance,
}: WeekViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Horizontal scroll wrapper */}
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
                    (utcToLocalDate(date) === utcToLocalDate(today) &&
                      slot.hour < new Date().getHours());

                  return (
                    <div
                      key={dayIdx}
                      className={`p-1 border-r border-border cursor-pointer hover:bg-accent/30 transition-colors relative min-h-[4rem] min-w-0 ${
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
                            onMarkAttendance={onMarkAttendance}
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
