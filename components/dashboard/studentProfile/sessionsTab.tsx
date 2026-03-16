"use client";

import { useState, useMemo } from "react";
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
import { MoreHorizontal, Plus } from "lucide-react";
import { StudentProfile } from "@/types/studentProfile";
import { SessionStatus, AttendanceStatus } from "@/types/session";
import {
  sessionStatusColors,
  sessionStatusLabels,
  attendanceStatusColors,
  attendanceStatusLabels,
} from "@/lib/enums";
import { useToast } from "@/hooks/use-toast";

interface SessionsTabProps {
  student: StudentProfile;
}

export default function SessionsTab({ student }: SessionsTabProps) {
  const { toast } = useToast();
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [sessionSearch, setSessionSearch] = useState("");

  const filteredSessions = useMemo(() => {
    let s = [...student.sessions];
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
  }, [student.sessions, sessionFilter, sessionSearch]);

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
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
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
        </div>
        <Button onClick={() => toast({ title: "فتح نموذج إضافة حصة" })}>
          <Plus className="h-4 w-4 ml-2" /> إضافة حصة
        </Button>
      </div>

      {filteredSessions.length === 0 ? (
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
                  } else if (
                    s.status === 1 ||
                    new Date(s.startTime) < new Date()
                  ) {
                    attendanceCell = (
                      <Select
                        onValueChange={(v) =>
                          toast({
                            title: `تم تسجيل الحضور: ${attendanceStatusLabels[parseInt(v) as AttendanceStatus]}`,
                          })
                        }
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue placeholder="تسجيل" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            AttendanceStatus.ABSENT_EXCUSED,
                            AttendanceStatus.ABSENT_UNEXCUSED,
                            AttendanceStatus.ATTENDED,
                            AttendanceStatus.CANCELLED,
                            AttendanceStatus.LATE,
                          ].map((val) => (
                            <SelectItem key={val} value={val.toString()}>
                              {attendanceStatusLabels[val]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  } else {
                    attendanceCell = "—";
                  }
                  return (
                    <TableRow key={s.id}>
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
                      <TableCell>
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => toast({ title: "عرض التفاصيل" })}
                            >
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toast({ title: "تعديل الحصة" })}
                            >
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toast({ title: "إعادة جدولة" })}
                            >
                              إعادة جدولة
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => toast({ title: "حذف الحصة" })}
                            >
                              حذف
                            </DropdownMenuItem>
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
    </div>
  );
}
