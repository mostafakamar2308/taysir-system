"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import type { TutorProfile, TutorSession } from "@/types/tutor";

interface ReportsTabProps {
  tutor: TutorProfile;
}

export default function ReportsTab({ tutor }: ReportsTabProps) {
  const [selectedReport, setSelectedReport] = useState<TutorSession | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const sessionsWithReports = tutor.sessions.filter((s) => s.report);

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
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تقارير الحصص لهذا الشهر</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsWithReports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد تقارير مسجلة لهذا الشهر
            </p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الموضوع</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionsWithReports.map((s) => (
                    <TableRow key={s.sessionId}>
                      <TableCell>{formatDate(s.startTime)}</TableCell>
                      <TableCell>{s.studentName}</TableCell>
                      <TableCell>{s.topic || "—"}</TableCell>
                      <TableCell>
                        {s.report?.rating ? (
                          <Badge variant="outline">{s.report.rating} / 5</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedReport(s);
                            setDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل التقرير</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">الطالب</p>
                <p className="font-medium">{selectedReport.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">التاريخ والوقت</p>
                <p>
                  {formatDate(selectedReport.startTime)} –{" "}
                  {formatTime(selectedReport.startTime)} إلى{" "}
                  {formatTime(selectedReport.endTime)}
                </p>
              </div>
              {selectedReport.topic && (
                <div>
                  <p className="text-sm text-muted-foreground">الموضوع</p>
                  <p>{selectedReport.topic}</p>
                </div>
              )}
              {selectedReport.report?.rating && (
                <div>
                  <p className="text-sm text-muted-foreground">التقييم</p>
                  <p>{selectedReport.report.rating} / 5</p>
                </div>
              )}
              {selectedReport.report?.outcomes && (
                <div>
                  <p className="text-sm text-muted-foreground">النتائج</p>
                  <p>{selectedReport.report.outcomes}</p>
                </div>
              )}
              {selectedReport.report?.strengths && (
                <div>
                  <p className="text-sm text-muted-foreground">نقاط القوة</p>
                  <p>{selectedReport.report.strengths}</p>
                </div>
              )}
              {selectedReport.report?.weaknesses && (
                <div>
                  <p className="text-sm text-muted-foreground">نقاط الضعف</p>
                  <p>{selectedReport.report.weaknesses}</p>
                </div>
              )}
              {selectedReport.report?.nextGoals && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    الأهداف القادمة
                  </p>
                  <p>{selectedReport.report.nextGoals}</p>
                </div>
              )}
              {selectedReport.report?.comments && (
                <div>
                  <p className="text-sm text-muted-foreground">تعليقات</p>
                  <p>{selectedReport.report.comments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
