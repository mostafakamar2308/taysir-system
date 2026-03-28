"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Calendar, List, Search, ArrowRight, ArrowLeft } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import {
  AttendanceStatus,
  DashboardSession,
  SessionStatus,
} from "@/types/session";
import { WeekView } from "@/components/dashboard/sessions/views/weekView";
import { getWeekDates } from "@/lib/dates";
import SessionDetailPanel from "@/components/tutor/sessions/sessionDetailPanel";
import dayjs from "@/lib/dayjs";

interface SessionsClientProps {
  sessions: DashboardSession[];
  view: string;
  currentWeekStart: string;
  filter?: string;
  sessionIdParam: number | null;
}

export default function SessionsClient({
  sessions: initialSessions,
  view: initialView,
  currentWeekStart,
  sessionIdParam,
}: SessionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"calendar" | "table">(
    initialView === "calendar" ? "calendar" : "table",
  );
  const [currentDate, setCurrentDate] = useState(() =>
    dayjs(currentWeekStart).toDate(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailSession, setDetailSession] = useState<DashboardSession | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  if (sessionIdParam && !detailSession) {
    const session = initialSessions.find((s) => s.id === sessionIdParam);
    if (session) {
      setDetailSession(session);
      setDetailOpen(true);
    }
  }

  // Filter sessions (client-side for table view)
  const filteredSessions = useMemo(() => {
    let filtered = [...initialSessions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          (s.topic && s.topic.toLowerCase().includes(q)),
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === parseInt(statusFilter));
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [initialSessions, searchQuery, statusFilter]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const navigateWeek = (dir: number) => {
    const newDate = dayjs(currentDate)
      .add(dir * 7, "day")
      .toDate();
    setCurrentDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", dayjs(newDate).format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", dayjs(today).format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const handleSessionClick = (session: DashboardSession) => {
    setDetailSession(session);
    setDetailOpen(true);
  };

  const handleUpdate = () => {
    router.refresh();
    setDetailOpen(false);
    setDetailSession(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الحصص</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة حصصك وجدولك الأسبوعي
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewMode("calendar");
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", "calendar");
              router.push(`?${params.toString()}`);
            }}
          >
            <Calendar className="h-4 w-4 ml-1" />
            تقويم
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewMode("table");
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", "table");
              router.push(`?${params.toString()}`);
            }}
          >
            <List className="h-4 w-4 ml-1" />
            جدول
          </Button>
        </div>
      </div>

      {/* Filters for table view */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-50">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالطالب أو الموضوع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="0">مجدولة</SelectItem>
                  <SelectItem value="1">مكتملة</SelectItem>
                  <SelectItem value="2">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek(-1)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              اليوم
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek(1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold">
              {dayjs(weekDates[0]).format("D MMMM")} –{" "}
              {dayjs(weekDates[6]).format("D MMMM YYYY")}
            </div>
          </div>
          <WeekView
            weekDates={weekDates}
            sessions={initialSessions}
            onSlotClick={() => {}}
            onSessionClick={handleSessionClick}
            onMarkAttendance={() => {}}
          />
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الموضوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الحضور</TableHead>
                    <TableHead>التقرير</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        لا توجد حصص
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSessions.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSessionClick(s)}
                      >
                        <TableCell>{formatDate(s.startTime)}</TableCell>
                        <TableCell>
                          {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </TableCell>
                        <TableCell>{s.studentName}</TableCell>
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
                          ) : s.status === SessionStatus.COMPLETED &&
                            s.attendance &&
                            [
                              AttendanceStatus.ATTENDED,
                              AttendanceStatus.LATE,
                            ].includes(s.attendance.studentAttendance) ? (
                            <span className="text-blue-600 text-xs">
                              بحاجة تقرير
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Detail Panel */}
      {detailSession ? (
        <SessionDetailPanel
          session={detailSession}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={handleUpdate}
        />
      ) : null}
    </div>
  );
}
