"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Mail, Phone, Eye } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import { sessionStatusColors, sessionStatusLabels } from "@/const/sessions";
import {
  AttendanceStatus,
  DashboardSession,
  SessionStatus,
} from "@/types/session";
import SessionDetailPanel from "@/components/tutor/sessions/sessionDetailPanel";
import { statusColors, statusLabels } from "@/lib/enums";
import { StudentStatus } from "@/types/student";

interface StudentData {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: StudentStatus;
  sessions: DashboardSession[];
}

interface StudentsClientProps {
  students: StudentData[];
}

export default function StudentsClient({ students }: StudentsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    null,
  );
  const [sessionDetail, setSessionDetail] = useState<DashboardSession | null>(
    null,
  );
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())),
  );

  const handleStudentClick = (student: StudentData) => {
    setSelectedStudent(student);
  };

  const handleSessionClick = (session: DashboardSession) => {
    setSessionDetail(session);
    setSessionDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">الطلاب</h1>
        <p className="text-sm text-muted-foreground mt-1">
          قائمة الطلاب المخصصين لك
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث باسم الطالب أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            لا يوجد طلاب
          </div>
        ) : (
          filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStudentClick(student)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{student.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {student.email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </span>
                      )}
                      {student.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {student.phone}
                        </span>
                      )}
                    </div>
                    <Badge className={`mt-2 ${statusColors[student.status]}`}>
                      {statusLabels[student.status]}
                    </Badge>
                  </div>
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium">{student.sessions.length}</span>{" "}
                  حصة
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Student Sessions Dialog */}
      <Dialog
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle>حصص الطالب: {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">
                    البريد الإلكتروني
                  </p>
                  <p className="font-medium">{selectedStudent.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium">{selectedStudent.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <Badge className={statusColors[selectedStudent.status]}>
                    {statusLabels[selectedStudent.status]}
                  </Badge>
                </div>
              </div>

              {/* Sessions Table */}
              {selectedStudent.sessions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  لا توجد حصص
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الوقت</TableHead>
                        <TableHead>الموضوع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الحضور</TableHead>
                        <TableHead>التقرير</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudent.sessions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{formatDate(s.startTime)}</TableCell>
                          <TableCell>
                            {formatTime(s.startTime)} – {formatTime(s.endTime)}
                          </TableCell>
                          <TableCell>{s.topic || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                sessionStatusColors[s.status as SessionStatus]
                              }
                            >
                              {sessionStatusLabels[s.status as SessionStatus]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {s.attendance ? (
                              <Badge
                                className={
                                  s.attendance.tutorAttendance ===
                                  AttendanceStatus.ATTENDED
                                    ? "bg-green-100 text-green-700"
                                    : s.attendance.tutorAttendance ===
                                        AttendanceStatus.LATE
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-red-100 text-red-700"
                                }
                              >
                                {s.attendance.tutorAttendance ===
                                AttendanceStatus.ATTENDED
                                  ? "حاضر"
                                  : s.attendance.tutorAttendance ===
                                      AttendanceStatus.LATE
                                    ? "متأخر"
                                    : "غائب"}
                              </Badge>
                            ) : s.status === SessionStatus.COMPLETED ? (
                              <span className="text-amber-600 text-xs">
                                لم يسجل
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {s.report ? (
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary"
                              >
                                مكتمل
                              </Badge>
                            ) : s.status === SessionStatus.COMPLETED ? (
                              <span className="text-blue-600 text-xs">
                                بحاجة تقرير
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSessionClick(s)}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Session Detail Panel */}
      {sessionDetail && (
        <SessionDetailPanel
          session={sessionDetail}
          open={sessionDetailOpen}
          onOpenChange={setSessionDetailOpen}
          onUpdate={() => {
            // Refresh the student data (optional, but we'll just close)
            setSessionDetailOpen(false);
            // In a real app, you might want to re-fetch the student data.
          }}
        />
      )}
    </div>
  );
}
