"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Eye,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { StudentProfile, SessionRecord } from "@/types/studentProfile";
import { SessionStatus, AttendanceStatus } from "@/types/session";
import {
  sessionStatusColors,
  sessionStatusLabels,
  attendanceStatusColors,
  attendanceStatusLabels,
} from "@/lib/enums";
import { useToast } from "@/hooks/use-toast";
import AttendanceDialog from "@/components/dashboard/studentProfile/dialogs/attendanceDialog";
import EditSessionDialog from "@/components/dashboard/studentProfile/dialogs/editSessionDialog";
import DeleteSessionDialog from "@/components/dashboard/studentProfile/dialogs/deleteSessionDialog";
import ViewReportDialog from "@/components/dashboard/studentProfile/dialogs/viewReportDialog";
import AddSessionDialog from "@/components/dashboard/studentProfile/dialogs/addSessionDialog";
import { getStudentSessionsForMonth } from "@/actions/student";
import dayjs from "@/lib/dayjs";

interface SessionsTabProps {
  student: StudentProfile;
  tutors: { id: number; name: string | null }[];
}

export default function SessionsTab({ student, tutors }: SessionsTabProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<SessionRecord[]>(student.sessions);
  const [monthStart, setMonthStart] = useState(
    dayjs.utc().startOf("month").toISOString(),
  );
  const [loading, setLoading] = useState(false);

  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [attendanceDialog, setAttendanceDialog] = useState<{
    open: boolean;
    sessionId: number;
    currentStatus?: number;
    currentReason?: string | null;
  }>({ open: false, sessionId: 0 });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    session: SessionRecord | null;
  }>({ open: false, session: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    sessionId: number;
  }>({ open: false, sessionId: 0 });
  const [reportDialog, setReportDialog] = useState<{
    open: boolean;
    report: NonNullable<SessionRecord["report"]>;
    sessionDate: string;
  }>({ open: false, report: null!, sessionDate: "" });

  // دالة تغيير الشهر
  const fetchMonth = async (newMonthStart: string) => {
    setLoading(true);
    try {
      const data = await getStudentSessionsForMonth(student.id, newMonthStart);
      setSessions(data);
      setMonthStart(newMonthStart);
    } catch (error) {
      console.error("فشل جلب حصص الشهر", error);
      toast({ title: "حدث خطأ أثناء جلب الحصص", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = dayjs(monthStart)
      .utc()
      .add(direction === "next" ? 1 : -1, "month")
      .startOf("month")
      .toISOString();
    console.log({ monthStart, newMonth });

    fetchMonth(newMonth);
  };

  const formattedMonth = dayjs(monthStart).format("MMMM YYYY");

  const filteredSessions = useMemo(() => {
    let s = [...sessions];
    if (sessionFilter !== "all")
      s = s.filter((x) => x.status === parseInt(sessionFilter));
    if (sessionSearch) {
      const q = sessionSearch.toLowerCase();
      s = s.filter(
        (x) =>
          x.topic?.toLowerCase().includes(q) ||
          x.tutorName?.toLowerCase().includes(q),
      );
    }
    return s.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [sessions, sessionFilter, sessionSearch]);

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

  const handleRowClick = (session: SessionRecord) => {
    if (session.report) {
      setReportDialog({
        open: true,
        report: session.report,
        sessionDate: formatDate(session.startTime),
      });
    } else {
      toast({ title: "لا يوجد تقرير لهذه الحصة" });
    }
  };

  const handleEdit = (session: SessionRecord) => {
    setEditDialog({ open: true, session });
  };

  const handleDelete = (sessionId: number) => {
    setDeleteDialog({ open: true, sessionId });
  };

  const handleMarkAttendance = (session: SessionRecord) => {
    setAttendanceDialog({
      open: true,
      sessionId: session.id,
      currentStatus: session.attendance?.status,
      currentReason: session.attendance?.reason,
    });
  };

  return (
    <div className="space-y-4 mt-4">
      {/* السطر العلوي: بحث، فلتر، تنقل شهري، زر إضافة */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap items-center">
          <Input
            placeholder="بحث بالموضوع أو المعلم..."
            value={sessionSearch}
            onChange={(e) => setSessionSearch(e.target.value)}
            className="w-60"
          />
          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="0">مجدولة</SelectItem>
              <SelectItem value="1">مكتملة</SelectItem>
              <SelectItem value="2">ملغاة</SelectItem>
            </SelectContent>
          </Select>

          {/* أزرار التنقل بين الأشهر */}
          <div className="flex items-center gap-2 mr-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("next")}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-30 text-center">
              {formattedMonth}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("prev")}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" /> إضافة حصة
        </Button>
      </div>

      {/* عرض الجدول مع مؤشر التحميل */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">جاري تحميل الحصص...</p>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد حصص تطابق البحث</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>المعلم</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الحضور</TableHead>
                  <TableHead>التقرير</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((s) => {
                  const sessionStatusLabel =
                    sessionStatusLabels[s.status as SessionStatus];
                  const sessionStatusColor =
                    sessionStatusColors[s.status as SessionStatus];
                  let attendanceCell;
                  if (s.attendance) {
                    attendanceCell = (
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
                    );
                  } else if (s.status === SessionStatus.COMPLETED) {
                    attendanceCell = (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAttendance(s);
                        }}
                      >
                        تسجيل
                      </Button>
                    );
                  } else {
                    attendanceCell = "—";
                  }
                  const reportCell = s.report ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(s);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : (
                    "—"
                  );

                  return (
                    <TableRow
                      key={s.id}
                      className={
                        s.report ? "cursor-pointer hover:bg-muted/50" : ""
                      }
                      onClick={() => s.report && handleRowClick(s)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatDate(s.startTime)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTime(s.startTime)} – {formatTime(s.endTime)}
                      </TableCell>
                      <TableCell>{s.tutorName}</TableCell>
                      <TableCell>{s.topic || "—"}</TableCell>
                      <TableCell>
                        <Badge className={sessionStatusColor}>
                          {sessionStatusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>{attendanceCell}</TableCell>
                      <TableCell>{reportCell}</TableCell>
                      <TableCell>
                        <DropdownMenu dir="rtl">
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
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/sessions?sessionId=${s.id}`,
                                )
                              }
                            >
                              عرض تفاصيل الحصة
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(s)}>
                              تعديل الحصة
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(s.id)}
                            >
                              حذف الحصة
                            </DropdownMenuItem>
                            {s.status === SessionStatus.COMPLETED && (
                              <DropdownMenuItem
                                onClick={() => handleMarkAttendance(s)}
                              >
                                {s.attendance?.status
                                  ? "تعديل الحضور"
                                  : "تسجيل الحضور"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
      <AddSessionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        studentId={student.id}
        studentName={student.name}
        tutors={tutors}
        academyId={student.academyId}
        currentTutorId={student.tutorId}
      />

      <AttendanceDialog
        open={attendanceDialog.open}
        onOpenChange={(open) =>
          setAttendanceDialog({ ...attendanceDialog, open })
        }
        sessionId={attendanceDialog.sessionId}
        currentStatus={attendanceDialog.currentStatus}
        currentReason={attendanceDialog.currentReason}
      />

      {editDialog.session && (
        <EditSessionDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
          session={editDialog.session}
        />
      )}

      <DeleteSessionDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        sessionId={deleteDialog.sessionId}
      />

      {reportDialog.report && (
        <ViewReportDialog
          open={reportDialog.open}
          onOpenChange={(open) => setReportDialog({ ...reportDialog, open })}
          report={reportDialog.report}
          sessionDate={reportDialog.sessionDate}
        />
      )}
    </div>
  );
}
