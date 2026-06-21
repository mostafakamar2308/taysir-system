"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateSession } from "@/actions/sessions";
import { markStudentAttendanceByTutor } from "@/actions/tutor/attendance";
import { upsertSessionReport } from "@/actions/tutor/report";
import { formatDate, formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { SessionClientData } from "@/types/tutor/session";
import { Copy, ExternalLink, Video } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { updateSessionZoomLinks } from "@/actions/tutor/session";
import {
  AssignmentWithSolutions,
  deleteAssignment,
  getAssignmentForSession,
  uploadAssignment,
} from "@/actions/assignments";
import UploadAssignmentForm from "@/components/dashboard/common/uploadAssignmentForm";
import { gradeSolution } from "@/actions/homeworkSolution";

interface SessionDetailPanelProps {
  session: SessionClientData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function SessionDetailPanel({
  session,
  open,
  onOpenChange,
  onUpdate,
}: SessionDetailPanelProps) {
  const t = useTranslations("SessionDetail");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [editMode, setEditMode] = useState(false);

  // ––– session‑level edit fields –––
  const [editDate, setEditDate] = useState(
    dayjs(session.startTime).format("YYYY-MM-DD"),
  );
  const [editStartTime, setEditStartTime] = useState(
    dayjs(session.startTime).format("HH:mm"),
  );
  const [editDuration, setEditDuration] = useState(session.durationMinutes);
  const [topic, setTopic] = useState(session.topic || "");
  const [notes, setNotes] = useState(session.notes || "");

  const isPast = new Date(session.startTime) < new Date();
  const isCompleted = session.status === SessionStatus.COMPLETED;

  // ––– per‑participant editing states –––
  // attendance: participantId -> { status: string; reason: string }
  const [attendanceForms, setAttendanceForms] = useState<
    Record<number, { status: string; reason: string }>
  >(() => {
    const init: Record<number, { status: string; reason: string }> = {};
    session.participants.forEach((p) => {
      init[p.participantId] = {
        status: p.attendanceStatus?.toString() || "",
        reason: "",
      };
    });
    return init;
  });

  // report: participantId -> { rating, outcomes, strengths, weaknesses, nextGoals, comments }
  const [reportForms, setReportForms] = useState<
    Record<
      number,
      {
        rating: string;
        outcomes: string;
        strengths: string;
        weaknesses: string;
        nextGoals: string;
        comments: string;
      }
    >
  >(() => {
    const init: Record<
      number,
      {
        rating: string;
        outcomes: string;
        strengths: string;
        weaknesses: string;
        nextGoals: string;
        comments: string;
      }
    > = {};
    session.participants.forEach((p) => {
      init[p.participantId] = {
        rating: p.report?.rating?.toString() || "",
        outcomes: p.report?.outcomes || "",
        strengths: p.report?.strengths || "",
        weaknesses: p.report?.weaknesses || "",
        nextGoals: p.report?.nextGoals || "",
        comments: p.report?.comments || "",
      };
    });
    return init;
  });

  const [assignment, setAssignment] = useState<AssignmentWithSolutions | null>(
    null,
  );
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [hwActive, setHwActive] = useState(false);

  // ––– session update handler –––
  const handleEnterEditMode = () => {
    if (!isPast) {
      setEditDate(dayjs(session.startTime).format("YYYY-MM-DD"));
      setEditStartTime(dayjs(session.startTime).format("HH:mm"));
      setEditDuration(session.durationMinutes);
    }
    setTopic(session.topic || "");
    setNotes(session.notes || "");
    setEditMode(true);
  };

  const handleUpdateFullDetails = async () => {
    setLoading(true);
    try {
      const payload: {
        id: number;
        date?: string;
        startTime?: string;
        duration?: number;
        topic?: string;
      } = {
        id: session.id,
        topic: topic,
      };
      if (!isPast) {
        const startTimeISO = dayjs(
          `${editDate}T${editStartTime}:00`,
        ).toISOString();
        payload.date = editDate;
        payload.startTime = startTimeISO;
        payload.duration = editDuration;
      }
      await updateSession(payload);
      toast({ title: t("toast.updateSuccess") });
      setEditMode(false);
      onUpdate();
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({ title: error.message, variant: "destructive" });
      else toast({ title: t("toast.updateError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [zoomEditMode, setZoomEditMode] = useState(false);
  const [zoomJoinUrlInput, setZoomJoinUrlInput] = useState(
    session.zoomJoinUrl || "",
  );
  const [zoomStartUrlInput, setZoomStartUrlInput] = useState(
    session.zoomStartUrl || "",
  );

  // Add handler for saving zoom links
  const handleSaveZoomLinks = async () => {
    setLoading(true);
    try {
      await updateSessionZoomLinks(session.id, {
        zoomJoinUrl: zoomJoinUrlInput || null,
        zoomStartUrl: zoomStartUrlInput || null,
      });
      toast({ title: t("toast.zoomSaved") });
      setZoomEditMode(false);
      onUpdate();
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: t("toast.error"),
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  // ––– attendance per participant –––
  const handleMarkAttendance = async (participantId: number) => {
    const form = attendanceForms[participantId];
    if (!form || !form.status) {
      toast({
        title: t("attendance.selectStatusError"),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await markStudentAttendanceByTutor(
        participantId,
        parseInt(form.status) as AttendanceStatus,
        form.reason || undefined,
      );
      toast({ title: t("toast.attendanceSaved") });
      onUpdate();
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: t("toast.error"),
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  // ––– report per participant –––
  const handleSubmitReport = async (participantId: number) => {
    const form = reportForms[participantId];
    if (
      !form ||
      (!form.outcomes && !form.strengths && !form.weaknesses && !form.nextGoals)
    ) {
      toast({ title: t("report.missingFieldsError"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await upsertSessionReport(participantId, {
        rating: form.rating ? parseInt(form.rating) : undefined,
        outcomes: form.outcomes || null,
        strengths: form.strengths || null,
        weaknesses: form.weaknesses || null,
        nextGoals: form.nextGoals || null,
        comments: form.comments || null,
      });
      toast({ title: t("toast.reportSaved") });
      onUpdate();
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: t("toast.error"),
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  // Helper: attendance badge for a participant
  const attendanceBadge = (p: SessionClientData["participants"][number]) => {
    if (p.attendanceStatus === null) {
      return isCompleted ? (
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 bg-amber-50"
        >
          {t("attendance.notRecorded")}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    }
    const labels: Record<number, string> = {
      [AttendanceStatus.ATTENDED]: t("attendance.statusPresent"),
      [AttendanceStatus.LATE]: t("attendance.statusLate"),
      [AttendanceStatus.ABSENT_EXCUSED]: t("attendance.statusAbsentExcused"),
      [AttendanceStatus.ABSENT_UNEXCUSED]: t(
        "attendance.statusAbsentUnexcused",
      ),
    };
    const variant =
      p.attendanceStatus === AttendanceStatus.ATTENDED
        ? "bg-green-100 text-green-700"
        : p.attendanceStatus === AttendanceStatus.LATE
          ? "bg-orange-100 text-orange-700"
          : "bg-red-100 text-red-700";
    return (
      <Badge className={variant}>{labels[p.attendanceStatus] || "?"}</Badge>
    );
  };

  // Helper: report badge for a participant
  const reportBadge = (p: SessionClientData["participants"][number]) => {
    if (
      p.attendanceStatus !== null &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        p.attendanceStatus,
      ) &&
      !p.report
    ) {
      return (
        <Badge
          variant="outline"
          className="border-blue-300 text-blue-700 bg-blue-50"
        >
          {t("report.notWritten")}
        </Badge>
      );
    }
    if (p.report) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {t("report.completed")}
        </Badge>
      );
    }
    return null;
  };

  useEffect(() => {
    if (activeTab === "homework" && !hwActive) {
      setHwActive(true);
      setAssignmentLoading(true);
      getAssignmentForSession(session.id)
        .then(setAssignment)
        .catch(() =>
          toast({ title: "خطأ في تحميل الواجب", variant: "destructive" }),
        )
        .finally(() => setAssignmentLoading(false));
    }
  }, [activeTab, hwActive, toast, session.id]);

  const handleUploadAssignment = async (formData: FormData) => {
    setLoading(true);
    try {
      await uploadAssignment(session.id, formData);
      toast({ title: "تم رفع الواجب" });
      // Refresh assignment data
      const updated = await getAssignmentForSession(session.id);
      setAssignment(updated);
      onUpdate();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "خطأ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full *:grow">
            <TabsTrigger value="details">{t("tabs.details")}</TabsTrigger>
            <TabsTrigger value="participants">
              {t("tabs.participants")}
            </TabsTrigger>
            <TabsTrigger value="zoom">{t("tabs.zoom")}</TabsTrigger>
            <TabsTrigger value="homework">{t("tabs.homework")}</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Badge
                  className={
                    sessionStatusColors[session.status as SessionStatus]
                  }
                >
                  {sessionStatusLabels[session.status as SessionStatus]}
                </Badge>
                {!editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEnterEditMode}
                  >
                    {t("details.editButton")}
                  </Button>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("details.student")}
                </p>
                <p className="font-medium">{session.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("details.datetime")}
                </p>
                <p dir="rtl">
                  {formatDate(session.startTime)} •{" "}
                  {formatTime(session.startTime)} –{" "}
                  {formatTime(session.endTime)}
                </p>
              </div>
              {editMode ? (
                <>
                  {!isPast && (
                    <>
                      <div className="space-y-2">
                        <Label>{t("details.date")}</Label>
                        <Input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("details.startTime")}</Label>
                        <Input
                          type="time"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("details.duration")}</Label>
                        <Input
                          type="number"
                          value={editDuration}
                          onChange={(e) =>
                            setEditDuration(parseInt(e.target.value))
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>{t("details.topic")}</Label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("details.notes")}</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateFullDetails}
                      disabled={loading}
                    >
                      {t("details.saveButton")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                    >
                      {t("details.cancelButton")}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {session.topic && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("details.topic")}
                      </p>
                      <p>{session.topic}</p>
                    </div>
                  )}
                  {session.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("details.notes")}
                      </p>
                      <p>{session.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6 mt-4">
            {session.participants.map((p) => (
              <div
                key={p.participantId}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{p.studentName}</h4>
                  <div className="flex gap-2">
                    {attendanceBadge(p)}
                    {reportBadge(p)}
                  </div>
                </div>

                {/* Attendance form for this participant */}
                {isCompleted && p.attendanceStatus === null && (
                  <div className="space-y-2 border-t pt-3">
                    <Label>{t("attendance.statusLabel")}</Label>
                    <Select
                      value={attendanceForms[p.participantId]?.status || ""}
                      onValueChange={(value) =>
                        setAttendanceForms((prev) => ({
                          ...prev,
                          [p.participantId]: {
                            ...prev[p.participantId],
                            status: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("attendance.selectPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value={AttendanceStatus.ATTENDED.toString()}
                        >
                          {t("attendance.statusPresent")}
                        </SelectItem>
                        <SelectItem value={AttendanceStatus.LATE.toString()}>
                          {t("attendance.statusLate")}
                        </SelectItem>
                        <SelectItem
                          value={AttendanceStatus.ABSENT_EXCUSED.toString()}
                        >
                          {t("attendance.statusAbsentExcused")}
                        </SelectItem>
                        <SelectItem
                          value={AttendanceStatus.ABSENT_UNEXCUSED.toString()}
                        >
                          {t("attendance.statusAbsentUnexcused")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="space-y-2">
                      <Label>{t("attendance.reasonLabel")}</Label>
                      <Textarea
                        value={attendanceForms[p.participantId]?.reason || ""}
                        onChange={(e) =>
                          setAttendanceForms((prev) => ({
                            ...prev,
                            [p.participantId]: {
                              ...prev[p.participantId],
                              reason: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        placeholder={t("attendance.reasonPlaceholder")}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAttendance(p.participantId)}
                      disabled={loading}
                    >
                      {t("attendance.submitButton")}
                    </Button>
                  </div>
                )}

                {p.attendanceStatus !== null && (
                  <div className="text-sm text-muted-foreground">
                    {t("attendance.alreadyRecorded")} {attendanceBadge(p)}
                  </div>
                )}

                {/* Report form for this participant */}
                {isCompleted &&
                  p.attendanceStatus !== null &&
                  [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
                    p.attendanceStatus,
                  ) &&
                  !p.report && (
                    <div className="space-y-2 border-t pt-3">
                      <h5 className="text-sm font-medium">
                        {t("report.title")}
                      </h5>
                      <div className="space-y-2">
                        <Label>{t("report.ratingLabel")}</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={reportForms[p.participantId]?.rating || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.participantId]: {
                                ...prev[p.participantId],
                                rating: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("report.outcomesLabel")} *</Label>
                        <Textarea
                          value={reportForms[p.participantId]?.outcomes || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.participantId]: {
                                ...prev[p.participantId],
                                outcomes: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("report.strengthsLabel")}</Label>
                        <Textarea
                          value={reportForms[p.participantId]?.strengths || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.participantId]: {
                                ...prev[p.participantId],
                                strengths: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("report.weaknessesLabel")}</Label>
                        <Textarea
                          value={reportForms[p.participantId]?.weaknesses || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.participantId]: {
                                ...prev[p.participantId],
                                weaknesses: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("report.nextGoalsLabel")} *</Label>
                        <Textarea
                          value={reportForms[p.participantId]?.nextGoals || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.participantId]: {
                                ...prev[p.participantId],
                                nextGoals: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("report.commentsLabel")}</Label>
                        <Textarea
                          value={reportForms[p.participantId]?.comments || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.participantId]: {
                                ...prev[p.participantId],
                                comments: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReport(p.participantId)}
                        disabled={loading}
                      >
                        {t("report.submitButton")}
                      </Button>
                    </div>
                  )}

                {p.report && (
                  <div className="text-sm space-y-2 border-t pt-3">
                    <h5 className="font-medium">{t("report.title")}</h5>
                    {p.report.rating && (
                      <p>
                        {t("report.rating")}: {p.report.rating}/5
                      </p>
                    )}
                    {p.report.outcomes && (
                      <p>
                        {t("report.outcomes")}: {p.report.outcomes}
                      </p>
                    )}
                    {p.report.strengths && (
                      <p>
                        {t("report.strengths")}: {p.report.strengths}
                      </p>
                    )}
                    {p.report.weaknesses && (
                      <p>
                        {t("report.weaknesses")}: {p.report.weaknesses}
                      </p>
                    )}
                    {p.report.nextGoals && (
                      <p>
                        {t("report.nextGoals")}: {p.report.nextGoals}
                      </p>
                    )}
                    {p.report.comments && (
                      <p>
                        {t("report.comments")}: {p.report.comments}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="homework" className="space-y-6 mt-4">
            {assignmentLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : !assignment ? (
              /* State 1: No assignment – show upload form */
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold">إضافة واجب</h4>
                <UploadAssignmentForm
                  onSubmit={handleUploadAssignment}
                  loading={loading}
                />
              </div>
            ) : (
              /* Assignment exists */
              <div className="space-y-6">
                {/* Assignment details */}
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">
                    {assignment.title || "واجب بدون عنوان"}
                  </h4>
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground">
                      {assignment.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm">
                    <span>الدرجة القصوى: {assignment.maxScore}</span>
                    {assignment.deadline && (
                      <span>
                        آخر موعد:{" "}
                        {dayjs(assignment.deadline).format("YYYY/MM/DD")}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <a
                      href={`/api/file/assignment/${assignment.id}`}
                      className="text-primary underline text-sm"
                      download
                    >
                      <Button>تحميل ملف الواجب</Button>
                    </a>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (confirm("حذف الواجب؟")) {
                          await deleteAssignment(session.id);
                          setAssignment(null);
                          onUpdate();
                        }
                      }}
                    >
                      حذف الواجب
                    </Button>
                  </div>
                </div>

                {/* List of participants and their solutions */}
                {session.participants.map((p) => {
                  const sol = assignment.solutions.find(
                    (s) => s.participantId === p.participantId,
                  );
                  return (
                    <div
                      key={p.participantId}
                      className="border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{p.studentName}</p>
                        {!sol ? (
                          <span className="text-sm text-amber-600">
                            لم يرفع بعد
                          </span>
                        ) : sol.score !== null ? (
                          <div className="text-sm space-y-1">
                            <Badge variant="secondary">تم التصحيح</Badge>
                            <p>
                              الدرجة: {sol.score}/{assignment.maxScore}
                            </p>
                            {sol.feedback && (
                              <p className="text-muted-foreground">
                                ملاحظات: {sol.feedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-blue-600">
                            تم الرفع – بانتظار التصحيح
                          </span>
                        )}
                      </div>
                      {sol && (
                        <div className="flex gap-2 items-center">
                          <a
                            href={`/api/file/solution/${sol.id}`}
                            download
                            className="text-xs underline"
                          >
                            تحميل الحل
                          </a>
                          {sol.score === null && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // open grading dialog
                                const grade = prompt(
                                  "أدخل الدرجة (من " +
                                    assignment.maxScore +
                                    ")",
                                );
                                if (grade) {
                                  const feedback =
                                    prompt("ملاحظات (اختياري)") || "";
                                  gradeSolution(
                                    sol.id,
                                    parseInt(grade),
                                    feedback,
                                  ).then(() => {
                                    getAssignmentForSession(session.id).then(
                                      setAssignment,
                                    );
                                    onUpdate();
                                  });
                                }
                              }}
                            >
                              تصحيح
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Zoom Tab */}
          {session.zoomJoinUrl || zoomEditMode ? (
            <TabsContent value="zoom" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Video className="h-5 w-5" />
                    <span className="font-semibold">{t("zoom.title")}</span>
                  </div>
                  {session.zoomJoinUrl && !zoomEditMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoomEditMode(true)}
                    >
                      {t("zoom.editButton")}
                    </Button>
                  )}
                </div>

                {zoomEditMode ? (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="space-y-2">
                      <Label>{t("zoom.joinUrlLabel")}</Label>
                      <Input
                        value={zoomJoinUrlInput}
                        onChange={(e) => setZoomJoinUrlInput(e.target.value)}
                        placeholder="https://zoom.us/j/..."
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("zoom.startUrlLabel")}</Label>
                      <Input
                        value={zoomStartUrlInput}
                        onChange={(e) => setZoomStartUrlInput(e.target.value)}
                        placeholder="https://zoom.us/s/..."
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("zoom.startUrlHelp")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveZoomLinks} disabled={loading}>
                        {t("zoom.saveButton")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setZoomEditMode(false);
                          setZoomJoinUrlInput(session.zoomJoinUrl || "");
                          setZoomStartUrlInput(session.zoomStartUrl || "");
                        }}
                      >
                        {t("zoom.cancelButton")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {session.zoomJoinUrl && (
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">
                          {t("zoom.joinUrlLabel")}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={session.zoomJoinUrl}
                            readOnly
                            className="font-mono text-sm"
                            dir="ltr"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            title={t("zoom.copyTitle")}
                            onClick={() => {
                              navigator.clipboard.writeText(
                                session.zoomJoinUrl || "",
                              );
                              toast({ title: t("toast.copySuccess") });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title={t("zoom.openTitle")}
                            onClick={() =>
                              window.open(session.zoomJoinUrl!, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {session.zoomStartUrl && (
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">
                          {t("zoom.startUrlLabel")}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={session.zoomStartUrl}
                            readOnly
                            className="font-mono text-sm bg-muted/50"
                            dir="ltr"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            title={t("zoom.copyTitle")}
                            onClick={() => {
                              navigator.clipboard.writeText(
                                session.zoomStartUrl || "",
                              );
                              toast({ title: t("toast.copySuccess") });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title={t("zoom.openTitle")}
                            onClick={() =>
                              window.open(session.zoomStartUrl!, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("zoom.helpText")}
                    </p>
                  </>
                )}
              </div>
            </TabsContent>
          ) : (
            /* No Zoom link yet, show initial setup form */
            <TabsContent value="zoom" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Video className="h-5 w-5" />
                  <span className="font-semibold">{t("zoom.title")}</span>
                </div>
                <div className="border rounded-lg p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("zoom.noLinkInstructions")}
                  </p>
                  <div className="space-y-2">
                    <Label>{t("zoom.joinUrlLabel")}</Label>
                    <Input
                      value={zoomJoinUrlInput}
                      onChange={(e) => setZoomJoinUrlInput(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("zoom.startUrlLabel")}</Label>
                    <Input
                      value={zoomStartUrlInput}
                      onChange={(e) => setZoomStartUrlInput(e.target.value)}
                      placeholder="https://zoom.us/s/..."
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("zoom.startUrlHelp")}
                    </p>
                  </div>
                  <Button onClick={handleSaveZoomLinks} disabled={loading}>
                    {t("zoom.saveButton")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("closeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
