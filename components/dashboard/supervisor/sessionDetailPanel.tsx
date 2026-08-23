"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  sendSessionReminder,
  sendZoomLink,
} from "@/actions/supervisor/reminders";
import {
  markStudentAttendanceBySupervisor,
  upsertTutorAttendance,
} from "@/actions/supervisor/attendance";
import { upsertSessionReportBySupervisor } from "@/actions/supervisor/report";
import { formatDate, formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import type {
  AdminSession,
  AdminSessionParticipant,
} from "@/types/session";
import { Copy, ExternalLink, Send, Video } from "lucide-react";
import { ReportContent } from "@/components/dashboard/sessions/reportContent";

function tutorReviewLabel(
  status: number,
  t: ReturnType<typeof useTranslations<"SupervisorSessions">>,
) {
  const labels: Record<number, string> = {
    [AttendanceStatus.ATTENDED]: t("detail.tutorAttendance.present"),
    [AttendanceStatus.LATE]: t("detail.tutorAttendance.late"),
    [AttendanceStatus.ABSENT_EXCUSED]: t(
      "detail.tutorAttendance.absentExcused",
    ),
    [AttendanceStatus.ABSENT_UNEXCUSED]: t(
      "detail.tutorAttendance.absentUnexcused",
    ),
  };
  return labels[status] || "?";
}

function tutorReviewClass(status: number) {
  if (status === AttendanceStatus.ATTENDED) return "bg-green-100 text-green-700";
  if (status === AttendanceStatus.LATE) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

interface Props {
  session: AdminSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface AttendanceForm {
  status: string;
  reason: string;
}

interface ReportForm {
  rating: string;
  outcomes: string;
  strengths: string;
  weaknesses: string;
  nextGoals: string;
  comments: string;
}

interface TutorReview {
  status: number;
  notes: string | null;
  supervisorName: string | null;
  reviewedAt: string | null;
}

export default function SupervisorSessionDetailPanel({
  session,
  open,
  onOpenChange,
  onUpdate,
}: Props) {
  const t = useTranslations("SupervisorSessions");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isCompleted = session.status === SessionStatus.COMPLETED;
  const isCancelled = session.status === SessionStatus.CANCELLED;

  const [attendanceForms, setAttendanceForms] = useState<
    Record<number, AttendanceForm>
  >(() => {
    const init: Record<number, AttendanceForm> = {};
    session.participants.forEach((p) => {
      init[p.id] = { status: p.status?.toString() || "", reason: p.reason || "" };
    });
    return init;
  });

  const [reportForms, setReportForms] = useState<Record<number, ReportForm>>(
    () => {
      const init: Record<number, ReportForm> = {};
      session.participants.forEach((p) => {
        init[p.id] = {
          rating: p.report?.rating?.toString() || "",
          outcomes: p.report?.outcome || "",
          strengths: p.report?.strengths || "",
          weaknesses: p.report?.weaknesses || "",
          nextGoals: p.report?.nextGoals || "",
          comments: p.report?.comments || "",
        };
      });
      return init;
    },
  );

  const [tutorStatus, setTutorStatus] = useState(
    session.tutorAttendance?.status?.toString() ?? "",
  );
  const [tutorNotes, setTutorNotes] = useState(
    session.tutorAttendance?.notes || "",
  );

  const [review, setReview] = useState<TutorReview | null>(() =>
    session.tutorAttendance
      ? {
          status: session.tutorAttendance.status,
          notes: session.tutorAttendance.notes,
          supervisorName: session.tutorAttendance.name,
          reviewedAt: session.tutorAttendance.reviewedAt,
        }
      : null,
  );
  const [editingReview, setEditingReview] = useState(false);

  const startEditReview = () => {
    if (!review) return;
    setTutorStatus(review.status.toString());
    setTutorNotes(review.notes || "");
    setEditingReview(true);
  };

  const refresh = () => {
    onUpdate();
    router.refresh();
  };

  const handleSendReminder = async () => {
    setLoading(true);
    try {
      const res = await sendSessionReminder(session.id);
      if (!res.ok) {
        toast({
          title: t("detail.toast.error"),
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: t("detail.toast.reminderSent", { count: res.data?.sent }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendZoomLink = async () => {
    setLoading(true);
    try {
      const res = await sendZoomLink(session.id);
      if (!res.ok) {
        toast({
          title: t("detail.toast.error"),
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: t("detail.toast.zoomSent", { count: res.data?.sent }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (participantId: number) => {
    const form = attendanceForms[participantId];
    if (!form?.status) {
      toast({
        title: t("detail.students.selectStatus"),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await markStudentAttendanceBySupervisor(
        participantId,
        parseInt(form.status) as AttendanceStatus,
        form.reason || undefined,
      );
      if (!res.ok) throw new Error(res.error);
      toast({ title: t("detail.students.saveAttendance") });
      refresh();
    } catch (error) {
      toast({
        title: t("detail.toast.error"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async (participantId: number) => {
    const form = reportForms[participantId];
    if (
      !form ||
      (!form.outcomes && !form.strengths && !form.weaknesses && !form.nextGoals)
    ) {
      toast({ title: t("detail.toast.error"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await upsertSessionReportBySupervisor(participantId, {
        rating: form.rating ? parseInt(form.rating) : undefined,
        outcomes: form.outcomes || null,
        strengths: form.strengths || null,
        weaknesses: form.weaknesses || null,
        nextGoals: form.nextGoals || null,
        comments: form.comments || null,
      });
      if (!res.ok) throw new Error(res.error);
      toast({ title: t("detail.students.saveReport") });
      refresh();
    } catch (error) {
      toast({
        title: t("detail.toast.error"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTutorAttendance = async () => {
    if (!tutorStatus) {
      toast({
        title: t("detail.students.selectStatus"),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await upsertTutorAttendance(
        session.id,
        parseInt(tutorStatus) as AttendanceStatus,
        tutorNotes || undefined,
      );
      if (!res.ok) {
        toast({
          title: t("detail.toast.error"),
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      setReview(res.data ?? null);
      setEditingReview(false);
      toast({ title: t("detail.tutorAttendance.save") });
      refresh();
    } catch (error) {
      toast({
        title: t("detail.toast.error"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const attendanceBadge = (p: AdminSessionParticipant) => {
    if (p.status === null) {
      return isCompleted ? (
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 bg-amber-50"
        >
          {t("detail.students.notRecorded")}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    }
    const labels: Record<number, string> = {
      [AttendanceStatus.ATTENDED]: t("detail.students.present"),
      [AttendanceStatus.LATE]: t("detail.students.late"),
      [AttendanceStatus.ABSENT_EXCUSED]: t("detail.students.absentExcused"),
      [AttendanceStatus.ABSENT_UNEXCUSED]: t(
        "detail.students.absentUnexcused",
      ),
    };
    const variant =
      p.status === AttendanceStatus.ATTENDED
        ? "bg-green-100 text-green-700"
        : p.status === AttendanceStatus.LATE
          ? "bg-orange-100 text-orange-700"
          : "bg-red-100 text-red-700";
    return <Badge className={variant}>{labels[p.status] || "?"}</Badge>;
  };

  const reportBadge = (p: AdminSessionParticipant) => {
    if (p.report) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {t("detail.students.report")}
        </Badge>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>{t("detail.title")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="w-full flex *:grow">
            <TabsTrigger value="overview">
              {t("detail.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="students">
              {t("detail.tabs.students")}
            </TabsTrigger>
            <TabsTrigger value="tutorAttendance">
              {t("detail.tabs.tutorAttendance")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge
                className={sessionStatusColors[session.status as SessionStatus]}
              >
                {sessionStatusLabels[session.status as SessionStatus]}
              </Badge>
              {session.isTrial && (
                <Badge
                  variant="outline"
                  className="border-amber-300 text-amber-700"
                >
                  تجريبية
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {t("detail.overview.time")}:{" "}
                </span>
                <span>
                  {formatDate(session.startTime)} •{" "}
                  {formatTime(session.startTime)} –{" "}
                  {formatTime(session.endTime)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("detail.overview.tutor")}:{" "}
                </span>
                <span>{session.tutorName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("detail.overview.group")}:{" "}
                </span>
                <span>{session.groupName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("detail.overview.students")}:{" "}
                </span>
                <span>{session.participants.map((p) => p.name).join("، ")}</span>
              </div>
              {session.topic && (
                <div>
                  <span className="text-muted-foreground">
                    {t("detail.overview.topic")}:{" "}
                  </span>
                  <span>{session.topic}</span>
                </div>
              )}
            </div>

            {!isCancelled && session.zoomUrl && (
              <div className="flex flex-wrap gap-2 items-center pt-1">
                <Input
                  value={session.zoomUrl}
                  readOnly
                  className="flex-1 min-w-[200px] font-mono text-sm"
                  dir="ltr"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(session.zoomUrl!);
                    toast({ title: t("detail.toast.copySuccess") });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={session.zoomUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={t("detail.overview.join")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}

            {!isCancelled && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  onClick={handleSendReminder}
                  disabled={loading}
                >
                  <Send className="h-4 w-4 ml-1" />
                  {t("detail.actions.sendReminder")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendZoomLink}
                  disabled={loading}
                >
                  <Video className="h-4 w-4 ml-1" />
                  {t("detail.actions.sendZoomLink")}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-6 mt-4">
            {session.participants.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-semibold">{p.name}</h4>
                  <div className="flex gap-2">
                    {attendanceBadge(p)}
                    {reportBadge(p)}
                  </div>
                </div>

                {isCompleted && p.status === null && (
                  <div className="space-y-2 border-t pt-3">
                    <Label>{t("detail.students.recordAttendance")}</Label>
                    <Select
                      value={attendanceForms[p.id]?.status || ""}
                      onValueChange={(value) =>
                        setAttendanceForms((prev) => ({
                          ...prev,
                          [p.id]: { ...prev[p.id], status: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("detail.students.selectStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AttendanceStatus.ATTENDED.toString()}>
                          {t("detail.students.present")}
                        </SelectItem>
                        <SelectItem value={AttendanceStatus.LATE.toString()}>
                          {t("detail.students.late")}
                        </SelectItem>
                        <SelectItem
                          value={AttendanceStatus.ABSENT_EXCUSED.toString()}
                        >
                          {t("detail.students.absentExcused")}
                        </SelectItem>
                        <SelectItem
                          value={AttendanceStatus.ABSENT_UNEXCUSED.toString()}
                        >
                          {t("detail.students.absentUnexcused")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={attendanceForms[p.id]?.reason || ""}
                      onChange={(e) =>
                        setAttendanceForms((prev) => ({
                          ...prev,
                          [p.id]: { ...prev[p.id], reason: e.target.value },
                        }))
                      }
                      rows={2}
                      placeholder={t("detail.students.reasonLabel")}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleMarkAttendance(p.id)}
                      disabled={loading}
                    >
                      {t("detail.students.saveAttendance")}
                    </Button>
                  </div>
                )}

                {isCompleted &&
                  p.status !== null &&
                  [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
                    p.status,
                  ) && (
                    <div className="space-y-2 border-t pt-3">
                      <h5 className="text-sm font-medium">
                        {t("detail.students.writeReport")}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>{t("detail.students.ratingLabel")}</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={reportForms[p.id]?.rating || ""}
                            onChange={(e) =>
                              setReportForms((prev) => ({
                                ...prev,
                                [p.id]: {
                                  ...prev[p.id],
                                  rating: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>{t("detail.students.outcomesLabel")}</Label>
                        <Textarea
                          value={reportForms[p.id]?.outcomes || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.id]: {
                                ...prev[p.id],
                                outcomes: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>{t("detail.students.strengthsLabel")}</Label>
                        <Textarea
                          value={reportForms[p.id]?.strengths || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.id]: {
                                ...prev[p.id],
                                strengths: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>{t("detail.students.weaknessesLabel")}</Label>
                        <Textarea
                          value={reportForms[p.id]?.weaknesses || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.id]: {
                                ...prev[p.id],
                                weaknesses: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>{t("detail.students.nextGoalsLabel")}</Label>
                        <Textarea
                          value={reportForms[p.id]?.nextGoals || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.id]: {
                                ...prev[p.id],
                                nextGoals: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>{t("detail.students.commentsLabel")}</Label>
                        <Textarea
                          value={reportForms[p.id]?.comments || ""}
                          onChange={(e) =>
                            setReportForms((prev) => ({
                              ...prev,
                              [p.id]: {
                                ...prev[p.id],
                                comments: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveReport(p.id)}
                        disabled={loading}
                      >
                        {t("detail.students.saveReport")}
                      </Button>
                    </div>
                  )}

                {p.report && (
                  <div className="border-t pt-3">
                    <ReportContent report={p.report} />
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="tutorAttendance" className="space-y-4 mt-4">
            {!isCompleted ? (
              <p className="text-center text-muted-foreground py-6 text-sm">
                {t("detail.tabs.tutorAttendance")}
              </p>
            ) : review && !editingReview ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {t("detail.tutorAttendance.title")}
                  </p>
                  <Button variant="ghost" size="sm" onClick={startEditReview}>
                    {t("detail.tutorAttendance.edit")}
                  </Button>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={tutorReviewClass(review.status)}>
                      {tutorReviewLabel(review.status, t)}
                    </Badge>
                  </div>
                  {review.notes && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {review.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground pt-1 border-t">
                    {t("detail.tutorAttendance.reviewedBy")}:{" "}
                    {review.supervisorName || "—"}
                    {review.reviewedAt &&
                      ` • ${t("detail.tutorAttendance.reviewedAt")} ${formatDate(
                        review.reviewedAt,
                      )}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {t("detail.tutorAttendance.title")}
                </p>
                <div className="space-y-1">
                  <Label>{t("detail.tutorAttendance.statusLabel")}</Label>
                  <Select value={tutorStatus} onValueChange={setTutorStatus}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("detail.students.selectStatus")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AttendanceStatus.ATTENDED.toString()}>
                        {t("detail.tutorAttendance.present")}
                      </SelectItem>
                      <SelectItem value={AttendanceStatus.LATE.toString()}>
                        {t("detail.tutorAttendance.late")}
                      </SelectItem>
                      <SelectItem
                        value={AttendanceStatus.ABSENT_EXCUSED.toString()}
                      >
                        {t("detail.tutorAttendance.absentExcused")}
                      </SelectItem>
                      <SelectItem
                        value={AttendanceStatus.ABSENT_UNEXCUSED.toString()}
                      >
                        {t("detail.tutorAttendance.absentUnexcused")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{t("detail.tutorAttendance.notesLabel")}</Label>
                  <Textarea
                    value={tutorNotes}
                    onChange={(e) => setTutorNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveTutorAttendance} disabled={loading}>
                    {t("detail.tutorAttendance.save")}
                  </Button>
                  {editingReview && (
                    <Button
                      variant="outline"
                      onClick={() => setEditingReview(false)}
                    >
                      {t("detail.tutorAttendance.cancel")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("detail.closeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
