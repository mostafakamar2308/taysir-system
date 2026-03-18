"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  attendanceStatusColors,
  attendanceStatusLabels,
  sessionStatusColors,
  sessionStatusLabels,
} from "@/const/sessions";
import type { TutorProfile, TutorSession } from "@/types/tutor";
import { Plus } from "lucide-react";

interface SessionsTabProps {
  tutor: TutorProfile;
  onSessionClick: (session: TutorSession) => void;
  onAddSession: () => void;
}

export default function SessionsTab({
  tutor,
  onSessionClick,
  onAddSession,
}: SessionsTabProps) {
  const [sessionFilter, setSessionFilter] = useState("all");
  const [sessionSearch, setSessionSearch] = useState("");

  const filteredSessions = useMemo(() => {
    let s = [...tutor.sessions];
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
  }, [tutor.sessions, sessionFilter, sessionSearch]);

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
        <Button onClick={onAddSession}>
          <Plus className="h-4 w-4 ml-2" /> إضافة حصة
        </Button>
      </div>

      {filteredSessions.length === 0 ? (
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
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSessionClick(s)}
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
                        {s.attendance ? (
                          <Badge
                            className={
                              attendanceStatusColors[
                                s.attendance.tutorAttendance
                              ]
                            }
                          >
                            {
                              attendanceStatusLabels[
                                s.attendance.tutorAttendance
                              ]
                            }
                          </Badge>
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
