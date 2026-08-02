"use client";

import dayjs from "@/lib/dayjs";
import type { AdminSession } from "@/types/session";
import { SessionCard } from "./SessionCard";

interface Props {
  weekDates: Date[];
  sessions: AdminSession[];
  onSessionClick: (session: AdminSession) => void;
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
  onSessionClick,
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
        if (daySessions.length === 0) return null;

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
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
