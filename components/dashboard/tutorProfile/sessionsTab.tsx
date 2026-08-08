"use client";

import { useState, useEffect, useMemo } from "react";
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
import dayjs from "@/lib/dayjs";
import { getTutorSessionsForWeek } from "@/actions/tutor";
import type { TutorSessionCardData } from "@/types/tutor";
import { SessionStatus } from "@/types/session";
import { formatDate, formatTime } from "@/lib/dates";
import { AddSessionDialog } from "@/components/dashboard/sessions/AddSessionDialog";
import { TutorEditSessionDialog } from "./EditSessionDialog";
import { CancelSessionDialog } from "@/components/dashboard/sessions/CancelSessionDialog";
import { SessionDetailPanel } from "@/components/dashboard/sessions/SessionDetailPanel";
import type { AdminSession } from "@/types/session";
import { getSessionDetailsForManagement } from "@/actions/sessions";
import { useToast } from "@/hooks/use-toast";

interface Props {
  tutorId: number;
  academyId: number;
}

const statusColors: Record<number, string> = {
  [SessionStatus.SCHEDULED]: "border-blue-300 bg-blue-50",
  [SessionStatus.COMPLETED]: "border-green-300 bg-green-50",
  [SessionStatus.CANCELLED]: "border-red-300 bg-red-50",
};

export default function SessionsTab({ tutorId, academyId }: Props) {
  const [weekStart, setWeekStart] = useState(
    dayjs().startOf("week").subtract(1, "day").format("YYYY-MM-DD"),
  ); // Saturday
  const [sessions, setSessions] = useState<TutorSessionCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TutorSessionCardData | null>(null);
  const [cancel, setCancel] = useState<TutorSessionCardData | null>(null);
  const [detail, setDetail] = useState<AdminSession | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const data = await getTutorSessionsForWeek(tutorId, weekStart);
        setSessions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [weekStart, tutorId]);

  const filteredSessions = useMemo(() => {
    if (statusFilter === "all") return sessions;
    return sessions.filter((s) => s.status === parseInt(statusFilter));
  }, [sessions, statusFilter]);

  const navigate = (dir: number) => {
    const newStart = dayjs(weekStart)
      .add(dir * 7, "day")
      .format("YYYY-MM-DD");
    setWeekStart(newStart);
  };

  const handleDetailClick = async (cardData: TutorSessionCardData) => {
    try {
      const full = await getSessionDetailsForManagement(cardData.sessionId);
      setDetail(full);
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
            <SelectTrigger className="h-9 w-32.5">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="0">مجدولة</SelectItem>
              <SelectItem value="1">مكتملة</SelectItem>
              <SelectItem value="2">ملغاة</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 ml-1" /> إضافة
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
            <div
              key={s.id}
              className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition ${statusColors[s.status]}`}
              onClick={() => handleDetailClick(s)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{s.groupName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(s.startTime)} • {formatTime(s.startTime)} –{" "}
                    {formatTime(s.endTime)}
                  </p>
                  {s.topic && <p className="text-sm">{s.topic}</p>}
                </div>
                {s.status !== SessionStatus.CANCELLED ? (
                  <Badge
                    className={
                      s.isCompleted
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }
                  >
                    {s.isCompleted ? "مكتملة" : "مجدولة"}
                  </Badge>
                ) : null}
              </div>
              {s.isCompleted && (
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>
                    الحضور: {s.attendanceCount}/{s.totalParticipants}
                  </span>
                  <span>
                    التقارير: {s.reportCount}/{s.totalParticipants}
                  </span>
                  {s.hasAssignment && (
                    <>
                      <span>
                        الواجبات: {s.homeworkSubmissions}/{s.totalParticipants}
                      </span>
                      <span>
                        تم التصحيح: {s.homeworkGraded}/{s.totalParticipants}
                      </span>
                    </>
                  )}
                </div>
              )}
              {s.status !== SessionStatus.CANCELLED ? (
                <div className="flex justify-end mt-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(s);
                    }}
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCancel(s);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddSessionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        academyId={academyId}
      />
      {editing && (
        <TutorEditSessionDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          session={editing}
          academyId={academyId}
          tutorId={tutorId}
        />
      )}
      {cancel && (
        <CancelSessionDialog
          open={!!cancel}
          onOpenChange={() => setCancel(null)}
          sessionId={cancel.sessionId}
        />
      )}
      {detail && (
        <SessionDetailPanel
          session={detail}
          open={!!detail}
          onOpenChange={(open) => {
            if (!open) setDetail(null);
          }}
        />
      )}
    </div>
  );
}
