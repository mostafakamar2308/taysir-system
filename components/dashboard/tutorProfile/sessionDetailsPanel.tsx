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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  updateSession,
  deleteSession,
  updateAttendance,
} from "@/actions/sessions";
import { AttendanceStatus } from "@/types/session";
import {
  sessionStatusColors,
  sessionStatusLabels,
  attendanceStatusColors,
  attendanceStatusLabels,
} from "@/const/sessions";
import { TutorSession } from "@/types/tutor";

interface SessionDetailPanelProps {
  session: TutorSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export default function SessionDetailPanel({
  session,
  open,
  onOpenChange,
  onDeleted,
}: SessionDetailPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(session.startTime).toISOString().split("T")[0],
    startTime: new Date(session.startTime).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    duration: session.durationMinutes,
    topic: session.topic || "",
    // notes: session.notes || "",
  });
  const [attendanceStatus, setAttendanceStatus] = useState<string>(
    session.attendance?.tutorAttendance?.toString() || "",
  );
  const [attendanceReason, setAttendanceReason] = useState(
    session.attendance?.reason || "",
  );

  const isPast = new Date(session.startTime) < new Date();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateSession({
        id: session.id,
        date: formData.date,
        startTime: formData.startTime,
        duration: formData.duration,
        topic: formData.topic,
        scope: "this",
        // notes: formData.notes,
      });
      toast({ title: "تم تحديث الحصة" });
      setEditMode(false);
      router.refresh();
    } catch (error) {
      console.log(error);

      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteSession(session.id, "this");
      toast({ title: "تم حذف الحصة" });
      onOpenChange(false);
      onDeleted?.();
      router.refresh();
    } catch (error) {
      console.log(error);
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceSubmit = async () => {
    if (!attendanceStatus) return;
    setLoading(true);
    try {
      await updateAttendance(
        session.id,
        3 /* role = tutor */,
        parseInt(attendanceStatus),
        attendanceReason || undefined,
      );
      toast({ title: "تم تحديث الحضور" });
      router.refresh();
    } catch (error) {
      console.log(error);
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تفاصيل الحصة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!editMode ? (
            // View mode
            <>
              <div className="flex items-center gap-2">
                <Badge className={sessionStatusColors[session.status]}>
                  {sessionStatusLabels[session.status]}
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">الطالب</p>
                  <p className="font-medium">{session.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الوقت</p>
                  <p className="text-sm">
                    {new Date(session.startTime).toLocaleDateString("ar-EG")} –{" "}
                    {new Date(session.startTime).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    إلى{" "}
                    {new Date(session.endTime).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {session.topic && (
                  <div>
                    <p className="text-sm text-muted-foreground">الموضوع</p>
                    <p>{session.topic}</p>
                  </div>
                )}
                {/* {session.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">ملاحظات</p>
                    <p>{session.notes}</p>
                  </div>
                )} */}
                {isPast && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">تسجيل الحضور</p>
                    {session.attendance ? (
                      <Badge
                        className={
                          attendanceStatusColors[
                            session.attendance.tutorAttendance
                          ]
                        }
                      >
                        {
                          attendanceStatusLabels[
                            session.attendance.tutorAttendance
                          ]
                        }
                        {session.attendance.reason &&
                          ` – ${session.attendance.reason}`}
                      </Badge>
                    ) : (
                      <div className="space-y-2">
                        <Select
                          value={attendanceStatus}
                          onValueChange={setAttendanceStatus}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              AttendanceStatus.ATTENDED,
                              AttendanceStatus.LATE,
                              AttendanceStatus.ABSENT_EXCUSED,
                              AttendanceStatus.ABSENT_UNEXCUSED,
                            ].map((s) => (
                              <SelectItem key={s} value={String(s)}>
                                {attendanceStatusLabels[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(attendanceStatus ===
                          String(AttendanceStatus.ABSENT_EXCUSED) ||
                          attendanceStatus ===
                            String(AttendanceStatus.ABSENT_UNEXCUSED)) && (
                          <Input
                            placeholder="السبب"
                            value={attendanceReason}
                            onChange={(e) =>
                              setAttendanceReason(e.target.value)
                            }
                          />
                        )}
                        <Button size="sm" onClick={handleAttendanceSubmit}>
                          حفظ
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  تعديل
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  حذف
                </Button>
              </div>
            </>
          ) : (
            // Edit mode
            <>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>وقت البدء</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>المدة (دقيقة)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>الموضوع</Label>
                <Input
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                />
              </div>
              {/* <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div> */}
              <div className="flex gap-2">
                <Button onClick={handleUpdate} disabled={loading}>
                  حفظ
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  إلغاء
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
