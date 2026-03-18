"use client";

import { Fragment, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { StudentProfile, SessionRecord } from "@/types/studentProfile";
import { AttendanceSummary } from "@/components/dashboard/studentProfile/attendanceSummary";
import { attendanceStatusColors, attendanceStatusLabels } from "@/lib/enums";
import { AttendanceStatus } from "@/types/session";
import { cn } from "@/lib/utils";

interface AttendanceProgressTabProps {
  student: StudentProfile;
}

function SessionReportDialog({ session }: { session: SessionRecord }) {
  if (!session.report) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تقرير الحصة</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {new Date(session.startTime).toLocaleDateString("ar-EG")}
          </p>
        </DialogHeader>
        <div className="space-y-3">
          {session.report.rating && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">التقييم:</span>
              <span className="text-sm">{session.report.rating} / 5</span>
            </div>
          )}
          {session.report.outcomes && (
            <div>
              <p className="text-sm font-medium">النتائج:</p>
              <p className="text-sm text-muted-foreground">
                {session.report.outcomes}
              </p>
            </div>
          )}
          {session.report.strengths && (
            <div>
              <p className="text-sm font-medium">نقاط القوة:</p>
              <p className="text-sm text-muted-foreground">
                {session.report.strengths}
              </p>
            </div>
          )}
          {session.report.weaknesses && (
            <div>
              <p className="text-sm font-medium">نقاط الضعف:</p>
              <p className="text-sm text-muted-foreground">
                {session.report.weaknesses}
              </p>
            </div>
          )}
          {session.report.nextGoals && (
            <div>
              <p className="text-sm font-medium">الأهداف القادمة:</p>
              <p className="text-sm text-muted-foreground">
                {session.report.nextGoals}
              </p>
            </div>
          )}
          {session.report.comments && (
            <div>
              <p className="text-sm font-medium">تعليقات:</p>
              <p className="text-sm text-muted-foreground">
                {session.report.comments}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AttendanceProgressTab({
  student,
}: AttendanceProgressTabProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(
    new Set(),
  );

  const toggleExpand = (sessionId: number) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ملخص الحضور</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceSummary sessions={student.sessions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل الحصص مع التقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>الحضور</TableHead>
                  <TableHead>التقرير</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.sessions.map((s) => {
                  const isExpanded = expandedSessions.has(s.id);
                  return (
                    <Fragment key={s.id}>
                      <TableRow
                        className={cn(s.report && "cursor-pointer")}
                        onClick={() => toggleExpand(s.id)}
                      >
                        <TableCell>{formatDate(s.startTime)}</TableCell>
                        <TableCell>
                          {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </TableCell>
                        <TableCell>{s.topic || "—"}</TableCell>
                        <TableCell>
                          {s.attendance ? (
                            <Badge
                              className={
                                attendanceStatusColors[
                                  s.attendance.status as AttendanceStatus
                                ]
                              }
                            >
                              {
                                attendanceStatusLabels[
                                  s.attendance.status as AttendanceStatus
                                ]
                              }
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {s.report ? <SessionReportDialog session={s} /> : "—"}
                        </TableCell>
                        <TableCell>
                          {s.report ? (
                            isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          ) : null}
                        </TableCell>
                      </TableRow>
                      {isExpanded && s.report && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-2">
                              {s.report.outcomes && (
                                <div>
                                  <span className="text-sm font-medium">
                                    النتائج:{" "}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {s.report.outcomes}
                                  </span>
                                </div>
                              )}
                              {s.report.strengths && (
                                <div>
                                  <span className="text-sm font-medium">
                                    نقاط القوة:{" "}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {s.report.strengths}
                                  </span>
                                </div>
                              )}
                              {s.report.weaknesses && (
                                <div>
                                  <span className="text-sm font-medium">
                                    نقاط الضعف:{" "}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {s.report.weaknesses}
                                  </span>
                                </div>
                              )}
                              {s.report.nextGoals && (
                                <div>
                                  <span className="text-sm font-medium">
                                    الأهداف القادمة:{" "}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {s.report.nextGoals}
                                  </span>
                                </div>
                              )}
                              {s.report.comments && (
                                <div>
                                  <span className="text-sm font-medium">
                                    تعليقات:{" "}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {s.report.comments}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
