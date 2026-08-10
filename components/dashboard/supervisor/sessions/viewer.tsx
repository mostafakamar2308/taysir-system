"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import dayjs from "@/lib/dayjs";
import type { AdminSession } from "@/types/session";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ChevronLeft, CalendarDays, Filter } from "lucide-react";
import { formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import SupervisorSessionDetailPanel from "@/components/dashboard/supervisor/sessionDetailPanel";

interface Props {
  initialSessions: AdminSession[];
  initialWeekStart: string;
  initialSessionId?: number | null;
}

const dayNames = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export default function SupervisorSessionsViewer({
  initialSessions,
  initialWeekStart,
  initialSessionId,
}: Props) {
  const t = useTranslations("SupervisorSessions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [saturday, setSaturday] = useState(
    dayjs(initialWeekStart).startOf("day"),
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [missingAttendance, setMissingAttendance] = useState(false);
  const [missingReports, setMissingReports] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdminSession | null>(
    () =>
      initialSessionId != null
        ? initialSessions.find((s) => s.id === initialSessionId) ?? null
        : null,
  );

  useEffect(() => {
    if (initialSessionId != null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("sessionId");
      router.replace(
        params.toString() ? `?${params.toString()}` : "",
        { scroll: false },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) dates.push(saturday.add(i, "day").toDate());
    return dates;
  }, [saturday]);

  const filteredSessions = useMemo(() => {
    return initialSessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== parseInt(statusFilter))
        return false;
      if (missingAttendance && !s.participants.some((p) => p.status == null))
        return false;
      if (
        missingReports &&
        !s.participants.some(
          (p) =>
            p.status !== null &&
            [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
              p.status,
            ) &&
            p.report == null,
        )
      )
        return false;
      return true;
    });
  }, [initialSessions, statusFilter, missingAttendance, missingReports]);

  const navigate = (dir: number) => {
    const newSaturday = saturday.add(dir * 7, "day");
    setSaturday(newSaturday);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sessionId");
    params.set("week", newSaturday.format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const goToday = () => {
    const today = dayjs();
    const newSaturday = today.startOf("week").subtract(1, "day");
    setSaturday(newSaturday);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sessionId");
    params.set("week", newSaturday.format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const formatWeekLabel = () => {
    const start = saturday.format("D MMMM");
    const end = saturday.add(6, "day").format("D MMMM YYYY");
    return `${start} – ${end}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="gap-2">
            <CalendarDays className="h-4 w-4" />
            {t("weekNav.today")}
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground mr-2">
            {formatWeekLabel()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              <SelectItem value={SessionStatus.SCHEDULED.toString()}>
                {t("filters.scheduled")}
              </SelectItem>
              <SelectItem value={SessionStatus.COMPLETED.toString()}>
                {t("filters.completed")}
              </SelectItem>
              <SelectItem value={SessionStatus.CANCELLED.toString()}>
                {t("filters.cancelled")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={missingAttendance ? "default" : "outline"}
            size="sm"
            onClick={() => setMissingAttendance(!missingAttendance)}
            className="gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            {t("filters.missingAttendance")}
          </Button>
          <Button
            variant={missingReports ? "default" : "outline"}
            size="sm"
            onClick={() => setMissingReports(!missingReports)}
            className="gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            {t("filters.missingReports")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {weekDates.map((date, idx) => {
          const dayKey = dayjs(date).format("YYYY-MM-DD");
          const daySessions = filteredSessions.filter(
            (s) => dayjs(s.startTime).format("YYYY-MM-DD") === dayKey,
          );
          if (daySessions.length === 0) return null;
          return (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">
                  {dayNames[idx]}
                </span>
                <span className="text-lg font-bold text-primary">
                  {date.getDate()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {dayjs(date).format("MMMM YYYY")}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {daySessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    t={t}
                    onOpen={() => setSelectedSession(s)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedSession && (
        <SupervisorSessionDetailPanel
          key={selectedSession.id}
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => {
            if (!open) setSelectedSession(null);
          }}
          onUpdate={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function SessionCard({
  session,
  t,
  onOpen,
}: {
  session: AdminSession;
  t: ReturnType<typeof useTranslations<"SupervisorSessions">>;
  onOpen: () => void;
}) {
  const attendedCount = session.participants.filter(
    (p) => p.status !== null && [0, 3].includes(p.status),
  ).length;
  const reportsCount = session.participants.filter((p) => p.report !== null)
    .length;
  const total = session.participants.length;
  const hasTutorReview = session.tutorAttendance !== null;

  return (
    <button
      onClick={onOpen}
      className={`w-full text-right rounded-xl border p-3 transition-all hover:shadow-md ${sessionStatusColors[session.status as SessionStatus]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold">
          {formatTime(session.startTime)} – {formatTime(session.endTime)}
        </span>
        <Badge variant="outline" className="bg-card/80 text-[10px] px-1.5 py-0">
          {sessionStatusLabels[session.status as SessionStatus]}
        </Badge>
      </div>
      <p className="text-sm font-semibold mt-1">{session.tutorName}</p>
      <p className="text-xs text-muted-foreground truncate">
        {session.groupName}
      </p>
      {session.status === SessionStatus.COMPLETED && (
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {t("counts.attended")}: {attendedCount}/{total}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {t("counts.reports")}: {reportsCount}/{total}
          </Badge>
          {!hasTutorReview && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
            >
              {t("sessionItemReviewMissing")}
            </Badge>
          )}
        </div>
      )}
    </button>
  );
}
