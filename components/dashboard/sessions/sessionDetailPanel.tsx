"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { updateAttendance } from "@/actions/sessions";
import {
  User,
  GraduationCap,
  Clock,
  BookOpen,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  CalendarDays,
  StickyNote,
} from "lucide-react";
import {
  SessionStatus,
  AttendanceStatus,
  DashboardSession,
} from "@/types/session";
import {
  sessionStatusLabels,
  sessionStatusColors,
  attendanceStatusLabels,
  attendanceStatusColors,
} from "@/const/sessions";
import { formatDateArabic, utcToLocalTime } from "@/lib/dates";

interface Props {
  session: DashboardSession;
  onClose: () => void;
  onEdit: (session: DashboardSession) => void;
  onDelete: (session: DashboardSession) => void;
}

export function SessionDetailPanel({
  session,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [attendanceStatus, setAttendanceStatus] = useState<
    AttendanceStatus | ""
  >(session.attendance?.status || "");
  const [absenceReason, setAbsenceReason] = useState(
    session.attendance?.reason || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPast = new Date(session.startTime) < new Date();
  const startDate = new Date(session.startTime);
  const endDate = new Date(session.endTime);

  const handleAttendanceSave = async () => {
    if (!attendanceStatus) return;
    setIsSubmitting(true);
    try {
      await updateAttendance(
        session.id,
        attendanceStatus as AttendanceStatus,
        absenceReason || undefined,
      );
      toast({ title: "تم تحديث الحضور" });
      router.refresh();
      onClose(); // close panel after save (optional)
    } catch (error) {
      console.log({ error });

      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            تفاصيل الحصة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Recurring badge */}
          <div className="flex items-center gap-2">
            <Badge
              className={sessionStatusColors[session.status as SessionStatus]}
            >
              {sessionStatusLabels[session.status as SessionStatus]}
            </Badge>
            {session.recurringPatternId && (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3" />
                متكررة
              </Badge>
            )}
          </div>

          {/* Info grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">الطالب</p>
                <p className="text-sm font-medium">{session.studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">المعلم</p>
                <p className="text-sm font-medium">{session.tutorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">الوقت</p>
                <p className="text-sm font-medium">
                  {formatDateArabic(startDate)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {utcToLocalTime(startDate)} – {utcToLocalTime(endDate)} (
                  {session.durationMinutes} دقيقة)
                </p>
              </div>
            </div>
            {session.topic && (
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">الموضوع</p>
                  <p className="text-sm font-medium">{session.topic}</p>
                </div>
              </div>
            )}
            {session.notes && (
              <div className="flex items-center gap-3">
                <StickyNote className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">ملاحظات</p>
                  <p className="text-sm">{session.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Attendance section */}
          {isPast && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">تسجيل الحضور</Label>
                </div>

                {session.attendance && (
                  <Badge
                    className={
                      attendanceStatusColors[
                        session.attendance.status as SessionStatus
                      ]
                    }
                  >
                    {
                      attendanceStatusLabels[
                        session.attendance.status as SessionStatus
                      ]
                    }
                    {session.attendance.reason &&
                      ` – ${session.attendance.reason}`}
                  </Badge>
                )}

                <Select
                  value={String(attendanceStatus)}
                  onValueChange={(v) =>
                    setAttendanceStatus(Number(v) as AttendanceStatus)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(attendanceStatusLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                {(attendanceStatus === AttendanceStatus.ABSENT_EXCUSED ||
                  attendanceStatus === AttendanceStatus.ABSENT_UNEXCUSED) && (
                  <Input
                    placeholder="سبب الغياب..."
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    className="h-9"
                  />
                )}

                {attendanceStatus && (
                  <Button
                    size="sm"
                    onClick={handleAttendanceSave}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "جاري الحفظ..." : "حفظ الحضور"}
                  </Button>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => onEdit(session)}
            >
              <Edit className="h-4 w-4" />
              تعديل
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 text-destructive hover:text-destructive"
              onClick={() => onDelete(session)}
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
