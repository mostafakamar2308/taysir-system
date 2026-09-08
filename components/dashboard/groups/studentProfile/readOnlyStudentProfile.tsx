"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import {
  ArrowRight,
  Calendar,
  Clock,
  Users,
  Star,
  BookOpen,
  AlertCircle,
  MapPin,
  Languages,
  UserRound,
} from "lucide-react";
import type {
  ReadOnlyStudentProfile,
  SessionRecord,
} from "@/types/studentProfile";
import { SessionStatus, AttendanceStatus } from "@/types/session";
import { formatDate, formatTime } from "@/lib/dates";
import dayjs from "@/lib/dayjs";
import ReportsTab from "@/components/dashboard/studentProfile/reportsTab";

interface Props {
  student: ReadOnlyStudentProfile;
  backHref: string;
}

export default function ReadOnlyStudentProfileClient({
  student,
  backHref,
}: Props) {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للمجموعة
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" />
                  {student.age} سنة
                </span>
                {student.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {student.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {student.timezone}
                </span>
                {student.source && (
                  <span>
                    المصدر: <span className="font-medium">{student.source}</span>
                  </span>
                )}
                {student.preferredLanguage && (
                  <span className="flex items-center gap-1">
                    <Languages className="h-3.5 w-3.5" />
                    {student.preferredLanguage}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">المجموعات: </span>
                {student.groups.length === 0 ? (
                  <span>لا يوجد</span>
                ) : (
                  student.groups.map((g, idx) => (
                    <span key={g.groupId}>
                      <span className="font-medium">{g.tutorName}</span>
                      {!g.isPrivate && " (مجموعة)"}
                      {idx < student.groups.length - 1 && "، "}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
          {[
            { val: "overview", label: "نظرة عامة" },
            { val: "sessions", label: "الحصص" },
            { val: "reports", label: "التقارير والتقدم" },
          ].map((t) => (
            <TabsTrigger
              key={t.val}
              value={t.val}
              className="flex-1 min-w-25 text-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab sessions={student.sessions} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab sessions={student.sessions} />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab sessions={student.sessions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ sessions }: { sessions: SessionRecord[] }) {
  const stats = useMemo(() => {
    const now = dayjs();
    const monthStart = now.startOf("month");
    const monthEnd = now.endOf("month");
    const monthSessions = sessions.filter((s) => {
      const d = dayjs(s.startTime);
      return d.isAfter(monthStart) && d.isBefore(monthEnd);
    });
    const totalSessions = monthSessions.length;
    const nextSessions = monthSessions.filter((s) =>
      dayjs(s.startTime).isAfter(now),
    ).length;
    const present = monthSessions.filter(
      (s) =>
        s.attendance &&
        s.attendance?.status !== null &&
        [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
          s.attendance.status,
        ),
    ).length;
    const absent = monthSessions.filter(
      (s) =>
        s.attendance &&
        s.attendance?.status !== null &&
        [
          AttendanceStatus.ABSENT_EXCUSED,
          AttendanceStatus.ABSENT_UNEXCUSED,
        ].includes(s.attendance.status),
    ).length;
    const ratings = monthSessions
      .filter((s) => s.report?.rating != null)
      .map((s) => s.report!.rating!);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
    const homeworkScores = monthSessions
      .filter((s) => s.homeworkSolution?.score != null)
      .map((s) => s.homeworkSolution!.score!);
    const avgHomework =
      homeworkScores.length > 0
        ? homeworkScores.reduce((a, b) => a + b, 0) / homeworkScores.length
        : 0;
    return {
      totalSessions,
      nextSessions,
      present,
      absent,
      avgRating,
      avgHomework,
    };
  }, [sessions]);

  const nextSession = useMemo(() => {
    const now = dayjs();
    const upcoming = sessions
      .filter((s) => dayjs(s.startTime).isAfter(now))
      .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)));
    return upcoming[0] ?? null;
  }, [sessions]);

  const latestSessions = useMemo(() => {
    return [...sessions]
      .filter((s) => dayjs(s.startTime).isBefore(dayjs()))
      .sort((a, b) => dayjs(b.startTime).diff(dayjs(a.startTime)))
      .slice(0, 3);
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="حصص الشهر"
          value={stats.totalSessions}
        />
        <StatCard
          icon={Clock}
          label="الحصص القادمة"
          value={stats.nextSessions}
        />
        <StatCard
          icon={Users}
          label="حاضر"
          value={stats.present}
          color="text-green-600"
        />
        <StatCard
          icon={AlertCircle}
          label="غائب"
          value={stats.absent}
          color="text-red-600"
        />
        <StatCard
          icon={Star}
          label="متوسط التقييم"
          value={stats.avgRating.toFixed(1)}
          isRating
        />
        <StatCard
          icon={BookOpen}
          label="متوسط الواجبات"
          value={stats.avgHomework.toFixed(1)}
          isRating
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الحصة القادمة</CardTitle>
        </CardHeader>
        <CardContent>
          {nextSession ? (
            <SessionCard session={nextSession} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد حصة قادمة
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">آخر الحصص</CardTitle>
        </CardHeader>
        <CardContent>
          {latestSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد حصص سابقة
            </p>
          ) : (
            <div className="grid gap-3">
              {latestSessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionsTab({ sessions }: { sessions: SessionRecord[] }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return sessions;
    return sessions.filter((s) => s.status === parseInt(statusFilter));
  }, [sessions, statusFilter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-lg">الحصص</CardTitle>
        <Combobox
          options={[
            { value: "0", label: "مجدولة" },
            { value: "1", label: "مكتملة" },
            { value: "2", label: "ملغاة" },
          ]}
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="جميع الحالات"
          emptyOption={{ value: "all", label: "جميع الحالات" }}
          className="h-9 w-[180px]"
        />
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            لا توجد حصص
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isRating,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color?: string;
  isRating?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color || "text-primary"}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">
            {value}
            {isRating && <span className="text-xs font-normal">/5</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionCard({ session }: { session: SessionRecord }) {
  const isCompleted = session.status === SessionStatus.COMPLETED;
  const statusColor = isCompleted
    ? "border-green-300 bg-green-50"
    : session.status === SessionStatus.CANCELLED
      ? "border-red-300 bg-red-50"
      : "border-blue-300 bg-blue-50";

  return (
    <div className={`p-3 border rounded-lg ${statusColor}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-sm">{session.groupName}</p>
          <p className="text-xs text-muted-foreground">{session.tutorName}</p>
          <p className="text-xs">
            {formatDate(session.startTime)} • {formatTime(session.startTime)} –{" "}
            {formatTime(session.endTime)}
          </p>
          {session.topic && <p className="text-xs mt-1">{session.topic}</p>}
        </div>
        <Badge
          className={
            isCompleted
              ? "bg-green-100 text-green-700"
              : session.status === SessionStatus.CANCELLED
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
          }
        >
          {isCompleted
            ? "مكتملة"
            : session.status === SessionStatus.CANCELLED
              ? "ملغاة"
              : "مجدولة"}
        </Badge>
      </div>
      {isCompleted && (
        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
          <span>
            الحضور: {session.attendance?.status != null ? "مسجل" : "غير مسجل"}
          </span>
          <span>التقرير: {session.report ? "مكتمل" : "غير مكتوب"}</span>
          {session.homeworkSolution && (
            <span>
              الواجب:{" "}
              {session.homeworkSolution.score != null
                ? `${session.homeworkSolution.score}`
                : "غير مصحح"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}