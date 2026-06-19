"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import {
  attendanceStatusColors,
  attendanceStatusLabels,
  sessionStatusColors,
  sessionStatusLabels,
} from "@/const/sessions";
import type { TutorSession } from "@/types/tutor";
import { ChevronRight, ChevronLeft } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { getTutorSessionsForMonth } from "@/actions/tutor";
import { SessionStatus } from "@/types/session";

interface SessionsTabProps {
  tutor: {
    id: number;
    academyId: number;
    sessions: TutorSession[];
    students: { id: number; name: string }[];
  };
  onSessionClick: (sessionId: number) => void;
}

export default function SessionsTab({
  tutor,
  onSessionClick,
}: SessionsTabProps) {
  const [sessions, setSessions] = useState<TutorSession[]>(tutor.sessions);
  const [monthStart, setMonthStart] = useState(
    dayjs().utc().startOf("month").toISOString(),
  );
  const [loading, setLoading] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("all");
  const [sessionSearch, setSessionSearch] = useState("");

  const fetchMonth = async (newMonthStart: string) => {
    setLoading(true);
    try {
      const data = await getTutorSessionsForMonth(tutor.id, newMonthStart);
      setSessions(data);
      setMonthStart(newMonthStart);
    } catch (error) {
      console.error("فشل جلب حصص الشهر", error);
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
    fetchMonth(newMonth);
  };

  const formattedMonth = dayjs(monthStart).format("MMMM YYYY");

  const filteredSessions = useMemo(() => {
    let s = [...sessions];
    if (sessionFilter !== "all") {
      s = s.filter((x) => x.status === parseInt(sessionFilter));
    }
    if (sessionSearch) {
      const q = sessionSearch.toLowerCase();
      s = s.filter(
        (x) =>
          x.topic?.toLowerCase().includes(q) ||
          x.studentName.toLowerCase().includes(q),
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

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap items-center">
          <Input
            placeholder="بحث بالموضوع أو الطالب..."
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth("next")}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-40 text-center">
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

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">جاري تحميل الحصص...</p>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد حصص</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الموضوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الحضور</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((s) => (
                    <TableRow
                      key={s.participantId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSessionClick(s.sessionId)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatDate(s.startTime)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTime(s.startTime)} – {formatTime(s.endTime)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/students/${s.studentId}`}
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {s.studentName}
                        </Link>
                      </TableCell>
                      <TableCell>{s.topic || "—"}</TableCell>
                      <TableCell>
                        <Badge className={sessionStatusColors[s.status]}>
                          {sessionStatusLabels[s.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.attendance.status !== null ? (
                          <Badge
                            className={
                              attendanceStatusColors[s.attendance.status]
                            }
                          >
                            {attendanceStatusLabels[s.attendance.status]}
                          </Badge>
                        ) : s.status === SessionStatus.COMPLETED ? (
                          <span className="text-amber-600 text-xs">
                            غير مسجل
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
