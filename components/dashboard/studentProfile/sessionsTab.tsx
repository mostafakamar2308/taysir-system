"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Plus } from "lucide-react";
import type { StudentProfile, SessionRecord } from "@/types/studentProfile";
import { SessionStatus } from "@/types/session";
import { formatDate, formatTime } from "@/lib/dates";
import dayjs from "@/lib/dayjs";
import { getStudentSessionsForWeek } from "@/actions/student";
import { SessionDetailPanel } from "@/components/dashboard/sessions/SessionDetailPanel";
import { getSessionDetailsForManagement } from "@/actions/sessions";
import type { AdminSession } from "@/types/session";
import { useToast } from "@/hooks/use-toast";
import AddSessionDialog from "@/components/dashboard/studentProfile/dialogs/addSessionDialog";

interface Props {
  student: StudentProfile;
  tutors: { id: number; name: string | null }[];
}

export default function SessionsTab({ student, tutors }: Props) {
  const { toast } = useToast();
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(
    dayjs().startOf("week").subtract(1, "day").format("YYYY-MM-DD"),
  );
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reportFilter, setReportFilter] = useState("all"); // all, missing, done
  const [detailSession, setDetailSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const data = await getStudentSessionsForWeek(student.id, weekStart);
        setSessions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [weekStart, student.id]);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === parseInt(statusFilter));
    }
    if (reportFilter === "missing") {
      result = result.filter(
        (s) => s.status === SessionStatus.COMPLETED && !s.report,
      );
    } else if (reportFilter === "done") {
      result = result.filter((s) => s.report);
    }
    return result;
  }, [sessions, statusFilter, reportFilter]);

  const navigate = (dir: number) => {
    setWeekStart((prev) =>
      dayjs(prev)
        .add(dir * 7, "day")
        .format("YYYY-MM-DD"),
    );
  };

  const handleSessionClick = async (sessionId: number) => {
    try {
      const full = await getSessionDetailsForManagement(sessionId);
      setDetailSession(full);
    } catch {
      toast({ title: "خطأ في تحميل التفاصيل", variant: "destructive" });
    }
  };

  const formatWeekLabel = () => {
    const start = dayjs(weekStart).format("D MMMM");
    const end = dayjs(weekStart).add(6, "day").format("D MMMM YYYY");
    return `${start} – ${end}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{formatWeekLabel()}</span>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="0">مجدولة</SelectItem>
              <SelectItem value="1">مكتملة</SelectItem>
              <SelectItem value="2">ملغاة</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reportFilter} onValueChange={setReportFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="التقرير" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="missing">ناقص</SelectItem>
              <SelectItem value="done">مكتمل</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setAddSessionOpen(true)}>
            <Plus className="h-4 w-4 ml-2" /> إضافة حصة
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">
          جاري التحميل...
        </p>
      ) : filteredSessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">لا توجد حصص</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onClick={() => handleSessionClick(s.id)}
            />
          ))}
        </div>
      )}

      {detailSession && (
        <SessionDetailPanel
          session={detailSession}
          open={!!detailSession}
          onOpenChange={(open) => {
            if (!open) setDetailSession(null);
          }}
        />
      )}

      <AddSessionDialog
        open={addSessionOpen}
        onOpenChange={setAddSessionOpen}
        studentId={student.id}
        studentName={student.name}
        tutors={tutors}
        preselectedTutorId={student.groups[0]?.tutorId ?? null}
        creditBalance={student.creditBalance}
      />
    </div>
  );
}
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
