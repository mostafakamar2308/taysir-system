"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Users,
  Star,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import type { StudentProfile, SessionRecord } from "@/types/studentProfile";
import { SessionStatus, AttendanceStatus } from "@/types/session";
import { formatDate, formatTime } from "@/lib/dates";
import dayjs from "@/lib/dayjs";
import { SessionDetailPanel } from "@/components/dashboard/sessions/SessionDetailPanel";
import { getSessionDetailsForManagement } from "@/actions/sessions";
import type { AdminSession } from "@/types/session";
import { useToast } from "@/hooks/use-toast";

interface Props {
  student: StudentProfile;
}

export default function OverviewTab({ student }: Props) {
  const { toast } = useToast();
  const [detailSession, setDetailSession] = useState<AdminSession | null>(null);

  // Monthly stats
  const stats = useMemo(() => {
    const now = dayjs();
    const monthStart = now.startOf("month");
    const monthEnd = now.endOf("month");
    const monthSessions = student.sessions.filter((s) => {
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
  }, [student.sessions]);

  // Next session
  const nextSession = useMemo(() => {
    const now = dayjs();
    const upcoming = student.sessions
      .filter((s) => dayjs(s.startTime).isAfter(now))
      .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)));
    return upcoming[0] ?? null;
  }, [student.sessions]);

  // Latest 3 sessions
  const latestSessions = useMemo(() => {
    return [...student.sessions]
      .filter((s) => dayjs(s.startTime).isBefore(dayjs()))
      .sort((a, b) => dayjs(b.startTime).diff(dayjs(a.startTime)))
      .slice(0, 3);
  }, [student.sessions]);

  const handleSessionClick = async (sessionId: number) => {
    const res = await getSessionDetailsForManagement(sessionId);
    setDetailSession(res.ok ? res.data : null);
    if (!res.ok) {
      toast({ title: "خطأ في تحميل التفاصيل", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Monthly Summary Cards */}
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

      {/* Next Session */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الحصة القادمة</CardTitle>
        </CardHeader>
        <CardContent>
          {nextSession ? (
            <SessionCard
              session={nextSession}
              onClick={() => handleSessionClick(nextSession.id)}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد حصة قادمة
            </p>
          )}
        </CardContent>
      </Card>

      {/* Latest Sessions */}
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
                <SessionCard
                  key={s.id}
                  session={s}
                  onClick={() => handleSessionClick(s.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Panel */}
      {detailSession && (
        <SessionDetailPanel
          session={detailSession}
          open={!!detailSession}
          onOpenChange={(open) => {
            if (!open) setDetailSession(null);
          }}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color?: string;
  isRating?: boolean;
}
// Helper: small stat card
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isRating,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color || "text-primary"}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">
            {isRating ? value : value}
            {isRating && <span className="text-xs font-normal">/5</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Session card used in both overview and sessions tab
function SessionCard({
  session,
  onClick,
}: {
  session: SessionRecord;
  onClick: () => void;
}) {
  const isCompleted = session.status === SessionStatus.COMPLETED;
  const statusColor = isCompleted
    ? "border-green-300 bg-green-50"
    : session.status === SessionStatus.CANCELLED
      ? "border-red-300 bg-red-50"
      : "border-blue-300 bg-blue-50";

  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition ${statusColor}`}
      onClick={onClick}
    >
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
              : "bg-blue-100 text-blue-700"
          }
        >
          {isCompleted ? "مكتملة" : "مجدولة"}
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
