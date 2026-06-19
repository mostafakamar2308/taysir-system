"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { SessionClientData } from "@/types/tutor/session";
import { Eye, Video } from "lucide-react";
import { useRouter } from "next/navigation";

interface TableViewProps {
  sessions: SessionClientData[];
  onSessionClick: (session: SessionClientData) => void;
}

export default function TableView({
  sessions,
  onSessionClick,
}: TableViewProps) {
  const t = useTranslations("TutorSessions");
  const router = useRouter();

  const getAttendanceSummary = (
    session: SessionClientData,
  ): { label: string; variant: "default" | "warning" | "neutral" } | null => {
    if (session.status !== SessionStatus.COMPLETED) return null;
    const total = session.participants.length;
    if (total === 0) return null;
    const recorded = session.participants.filter(
      (p) => p.attendanceStatus !== null,
    ).length;
    if (recorded === 0)
      return { label: t("attendanceNotRecorded"), variant: "warning" };
    if (recorded < total)
      return { label: t("attendancePartial"), variant: "warning" };
    return { label: t("attendanceRecorded"), variant: "default" };
  };

  const getReportSummary = (
    session: SessionClientData,
  ): { label: string; variant: "default" | "warning" | "neutral" } | null => {
    if (session.status !== SessionStatus.COMPLETED) return null;
    const total = session.participants.length;
    if (total === 0) return null;
    const needReport = session.participants.filter(
      (p) =>
        p.attendanceStatus !== null &&
        [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
          p.attendanceStatus,
        ),
    ).length;
    if (needReport === 0) return null;
    const reported = session.participants.filter(
      (p) =>
        p.report !== null &&
        p.attendanceStatus !== null &&
        [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
          p.attendanceStatus,
        ),
    ).length;
    if (reported === 0) return { label: t("reportNeeded"), variant: "warning" };
    if (reported < needReport)
      return { label: t("reportPartial"), variant: "warning" };
    return { label: t("reportCompleted"), variant: "default" };
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.date")}</TableHead>
            <TableHead>{t("table.time")}</TableHead>
            <TableHead>{t("table.student")}</TableHead>
            <TableHead>{t("table.topic")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.attendance")}</TableHead>
            <TableHead>{t("table.report")}</TableHead>
            <TableHead>{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center py-8 text-muted-foreground"
              >
                {t("table.noSessions")}
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((s) => {
              const attendanceSummary = getAttendanceSummary(s);
              const reportSummary = getReportSummary(s);

              return (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSessionClick(s)}
                >
                  <TableCell>{formatDate(s.startTime)}</TableCell>
                  <TableCell>
                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                  </TableCell>
                  <TableCell>{s.studentName}</TableCell>
                  <TableCell>{s.topic || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className={sessionStatusColors[s.status as SessionStatus]}
                    >
                      {sessionStatusLabels[s.status as SessionStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {attendanceSummary ? (
                      <Badge
                        variant={
                          attendanceSummary.variant === "warning"
                            ? "outline"
                            : "default"
                        }
                        className={
                          attendanceSummary.variant === "warning"
                            ? "border-amber-300 text-amber-700 bg-amber-50"
                            : "bg-green-100 text-green-700"
                        }
                      >
                        {attendanceSummary.label}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {reportSummary ? (
                      <Badge
                        variant={
                          reportSummary.variant === "warning"
                            ? "outline"
                            : "default"
                        }
                        className={
                          reportSummary.variant === "warning"
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : "bg-primary/10 text-primary"
                        }
                      >
                        {reportSummary.label}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    {s.zoomJoinUrl ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (s.zoomJoinUrl) router.push(s.zoomJoinUrl);
                        }}
                      >
                        <Video className="h-3.5 w-3.5 text-blue-500" />
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionClick(s);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
