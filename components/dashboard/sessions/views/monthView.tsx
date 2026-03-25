import { utcToLocalDate } from "@/lib/dates";
import { sessionStatusColors } from "@/const/sessions";
import dayjs from "@/lib/dayjs";
import { DashboardSession, SessionStatus } from "@/types/session";

const daysOfWeek = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];

type MonthViewProps = {
  date: Date;
  sessions: DashboardSession[];
  onDayClick: (date: Date) => void;
  onSessionClick: (session: DashboardSession) => void;
};

export function MonthView({
  date,
  sessions,
  onDayClick,
  onSessionClick,
}: MonthViewProps) {
  const startOfMonth = dayjs(date).startOf("month");
  const startOfWeek = startOfMonth.startOf("week");
  const endOfMonth = dayjs(date).endOf("month");
  const endOfWeek = endOfMonth.endOf("week");

  const days = [];
  let current = startOfWeek;
  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, "day")) {
    days.push(current.toDate());
    current = current.add(1, "day");
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getSessionsForDay = (day: Date) => {
    return sessions.filter((s) => {
      const sDate = new Date(s.startTime);
      return (
        sDate.getDate() === day.getDate() &&
        sDate.getMonth() === day.getMonth() &&
        sDate.getFullYear() === day.getFullYear()
      );
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div>
        {weeks.map((week, i) => (
          <div
            key={i}
            className="grid grid-cols-7 border-b border-border last:border-b-0"
          >
            {week.map((day) => {
              const isCurrentMonth = day.getMonth() === date.getMonth();
              const isToday = utcToLocalDate(day) === utcToLocalDate(today);
              const daySessions = getSessionsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 p-1 border-l border-border last:border-l-0 cursor-pointer hover:bg-accent/30 transition-colors ${
                    !isCurrentMonth ? "bg-muted/30" : ""
                  } ${isToday ? "bg-primary/5" : ""}`}
                  onClick={() => onDayClick(day)}
                >
                  <div className="text-right text-sm font-medium mb-1">
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {daySessions.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSessionClick(session);
                        }}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${sessionStatusColors[session.status as SessionStatus]}`}
                      >
                        {session.studentName} ({session.tutorName})
                      </div>
                    ))}
                    {daySessions.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{daySessions.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
