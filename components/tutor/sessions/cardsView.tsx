"use client";

import { useMemo } from "react";
import dayjs from "@/lib/dayjs";
import type { AdminSession } from "@/types/session";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import { CalendarClock, Clock, Eye, MoreHorizontal, Video } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  weekDates: Date[];
  sessions: AdminSession[];
  onSessionClick: (session: AdminSession) => void;
  onEditSession?: (session: AdminSession) => void;
  onCancelSession?: (session: AdminSession) => void;
  onExtendSession?: (session: AdminSession) => void;
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

const statusAccent: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]: "border-blue-200",
  [SessionStatus.COMPLETED]: "border-green-200",
  [SessionStatus.CANCELLED]: "border-red-200",
};

export function CardsView({
  weekDates,
  sessions,
  onSessionClick,
  onEditSession,
  onCancelSession,
  onExtendSession,
}: Props) {
  const router = useRouter();

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, AdminSession[]>();
    for (const session of sessions) {
      const dayKey = dayjs(session.startTime).format("YYYY-MM-DD");
      const bucket = map.get(dayKey) ?? [];
      bucket.push(session);
      map.set(dayKey, bucket);
    }
    for (const [, bucket] of map) {
      bucket.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [sessions]);

  const today = dayjs().format("YYYY-MM-DD");

  const attendanceSummary = (
    session: AdminSession,
  ): { label: string; warning: boolean } | null => {
    if (session.status !== SessionStatus.COMPLETED) return null;
    const total = session.participants.length;
    if (total === 0) return null;
    const recorded = session.participants.filter(
      (p) => p.status !== null,
    ).length;
    if (recorded === 0) return { label: "حضور غير مسجل", warning: true };
    if (recorded < total) return { label: "حضور جزئي", warning: true };
    return { label: "حضور مسجل", warning: false };
  };

  const reportSummary = (
    session: AdminSession,
  ): { label: string; warning: boolean } | null => {
    if (session.status !== SessionStatus.COMPLETED) return null;
    const needReport = session.participants.filter(
      (p) =>
        p.status !== null &&
        [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(p.status),
    ).length;
    if (needReport === 0) return null;
    const reported = session.participants.filter(
      (p) =>
        p.report !== null &&
        p.status !== null &&
        [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(p.status),
    ).length;
    if (reported === 0) return { label: "تقرير مطلوب", warning: true };
    if (reported < needReport) return { label: "تقرير جزئي", warning: true };
    return { label: "تقرير مكتمل", warning: false };
  };

  const renderSummaryBadge = (
    summary: { label: string; warning: boolean } | null,
    styles: { warn: string; ok: string },
  ) => {
    if (!summary) return null;
    return (
      <Badge
        variant="outline"
        className={summary.warning ? styles.warn : styles.ok}
      >
        {summary.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {weekDates.map((date, idx) => {
        const dayKey = dayjs(date).format("YYYY-MM-DD");
        const isToday = dayKey === today;
        const daySessions = sessionsByDay.get(dayKey) ?? [];

        return (
          <div
            key={dayKey}
            className={`rounded-xl border bg-card ${isToday ? "border-primary/40 shadow-sm" : "border-border"}`}
          >
            <div
              className={`flex items-center justify-between px-4 py-3 border-b rounded-t-xl ${
                isToday
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/40 border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <p
                  className={`text-sm font-bold ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {dayNames[idx]}
                </p>
                <span className="text-2xl font-bold text-foreground">
                  {date.getDate()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {dayjs(date).format("MMMM YYYY")}
                </span>
              </div>
              {isToday && <Badge>اليوم</Badge>}
              <Badge variant="secondary" className="gap-1">
                <CalendarClock className="h-3 w-3" />
                {daySessions.length} حصص
              </Badge>
            </div>

            {daySessions.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">
                لا توجد حصص في هذا اليوم
              </p>
            ) : (
              <div className="p-3 space-y-2">
                {daySessions.map((session) => {
                  const attendance = attendanceSummary(session);
                  const report = reportSummary(session);
                  const uploadedCount = session.participants.filter(
                    (p) => p.homeworkSolution !== null,
                  ).length;
                  const gradedCount = session.participants.filter(
                    (p) =>
                      p.homeworkSolution !== null &&
                      p.homeworkSolution.score !== null,
                  ).length;

                  return (
                    <div
                      key={session.id}
                      className={`relative group rounded-lg border bg-card p-3 cursor-pointer transition-all hover:shadow-md ${statusAccent[session.status]}`}
                      onClick={() => onSessionClick(session)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {formatTime(session.startTime)} –{" "}
                            {formatTime(session.endTime)}
                          </span>
                          {session.isTrial && (
                            <Badge variant="secondary" className="text-[10px]">
                              تجريبية
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {attendance &&
                            renderSummaryBadge(attendance, {
                              warn: "border-amber-300 text-amber-700 bg-amber-50",
                              ok: "bg-green-100 text-green-700 border-transparent",
                            })}
                          {report &&
                            renderSummaryBadge(report, {
                              warn: "border-blue-300 text-blue-700 bg-blue-50",
                              ok: "bg-primary/10 text-primary border-transparent",
                            })}
                          {session.assignment && (
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                              title="حالة الواجب"
                            >
                              واجب {uploadedCount}/{session.participants.length}
                              {gradedCount > 0 ? ` (${gradedCount} مصحح)` : ""}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {session.groupName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.participants
                              .map((p) => p.name ?? "")
                              .filter(Boolean)
                              .join("، ") || "—"}
                          </p>
                          {session.topic && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {session.topic}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            className={
                              sessionStatusColors[session.status as SessionStatus]
                            }
                          >
                            {sessionStatusLabels[session.status as SessionStatus]}
                          </Badge>
                          {session.zoomUrl ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (session.zoomUrl) router.push(session.zoomUrl);
                              }}
                            >
                              <Video className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSessionClick(session);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSession?.(session);
                                }}
                              >
                                تعديل
                              </DropdownMenuItem>
                              {dayjs(session.startTime).isBefore(dayjs()) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onExtendSession?.(session);
                                  }}
                                >
                                  <Clock className="h-3.5 w-3.5 ml-1" />
                                  طلب تمديد الوقت
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCancelSession?.(session);
                                }}
                              >
                                إلغاء
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}