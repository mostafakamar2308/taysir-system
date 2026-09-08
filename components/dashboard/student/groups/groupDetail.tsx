"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
  ArrowRight,
  Star,
  FileText,
  Calendar,
  ChevronDown,
  Video,
} from "lucide-react";
import type {
  StudentGroupDetail,
  StudentGroupSession,
} from "@/types/student/groups";
import { SessionStatus } from "@/types/session";
import { formatDate, formatTime } from "@/lib/dates";
import dayjs from "@/lib/dayjs";
import { RatingChart } from "@/components/dashboard/student/ratingChart";
import { ReportContent } from "@/components/dashboard/sessions/reportContent";

interface Props {
  group: StudentGroupDetail;
  backHref: string;
}

export default function StudentGroupDetailClient({ group, backHref }: Props) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return group.sessions;
    return group.sessions.filter((s) => s.status === parseInt(statusFilter));
  }, [group.sessions, statusFilter]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للمجموعات
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{group.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>المعلم: {group.tutorName}</span>
                <span>{group.studentCount} طالب</span>
                <span>
                  أنشئت في: {dayjs(group.createdAt).format("DD/MM/YYYY")}
                </span>
              </div>
            </div>
            <Badge variant="outline">
              {group.isPrivate ? "مجموعة خاصة" : "مجموعة"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">متوسط تقييمك</p>
            <p className="text-3xl font-bold flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-amber-500" />
              {group.averageRating != null
                ? group.averageRating.toFixed(1)
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">عدد التقارير</p>
            <p className="text-3xl font-bold flex items-center justify-center gap-1">
              <FileText className="h-5 w-5 text-primary" />
              {group.reportCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">آخر تقييم</p>
            <p className="text-3xl font-bold">
              {group.latestRating != null ? group.latestRating : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <RatingChart ratings={group.ratings} />

      {/* Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg">الحصص في المجموعة</CardTitle>
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
        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              لا توجد حصص
            </p>
          ) : (
            filtered.map((s) => <SessionCard key={s.id} session={s} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionCard({ session }: { session: StudentGroupSession }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = session.status === SessionStatus.COMPLETED;
  const isCancelled = session.status === SessionStatus.CANCELLED;

  const statusColor = isCompleted
    ? "border-green-300 bg-green-50"
    : isCancelled
      ? "border-red-300 bg-red-50"
      : "border-blue-300 bg-blue-50";

  return (
    <div className={`rounded-lg border ${statusColor}`}>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center justify-between gap-2 p-3 text-right hover:bg-muted/30 transition"
        >
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(session.startTime)} • {formatTime(session.startTime)} –{" "}
            {formatTime(session.endTime)}
          </div>
          {session.topic && <p className="text-sm font-medium mt-1">{session.topic}</p>}
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            <Badge
              className={
                isCompleted
                  ? "bg-green-100 text-green-700"
                  : isCancelled
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
              }
            >
              {isCompleted
                ? "مكتملة"
                : isCancelled
                  ? "ملغاة"
                  : "مجدولة"}
            </Badge>
            {isCompleted && (
              <>
                <span>الحضور: {session.attendanceStatus != null ? "مسجل" : "غير مسجل"}</span>
                <span>التقرير: {session.report ? "مكتوب" : "غير مكتوب"}</span>
              </>
            )}
          </div>
        </div>
        {session.report && (
          <Badge variant="outline" className="bg-primary/10 text-primary shrink-0">
            {session.report.rating != null ? `${session.report.rating} / 5` : "تقرير"}
          </Badge>
        )}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {session.recordingLink && (
        <a
          href={session.recordingLink}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 flex items-center gap-1 text-primary hover:text-primary/80 border-s px-3 text-sm font-medium"
        >
          <Video className="h-4 w-4" />
          مشاهدة التسجيل
        </a>
      )}
    </div>
      {expanded && session.report && (
        <div className="px-4 pb-4 pt-2 border-t">
          <ReportContent report={session.report} />
        </div>
      )}
    </div>
  );
}