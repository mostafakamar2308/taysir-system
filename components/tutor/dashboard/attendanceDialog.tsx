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
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { markStudentAttendanceByTutor } from "@/actions/tutor/attendance";
import { AttendanceStatus } from "@/types/session";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { SessionParticipantSummary } from "./types";

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  participants: SessionParticipantSummary[];
}

export default function AttendanceDialog({
  open,
  onOpenChange,
  title,
  participants,
}: AttendanceDialogProps) {
  const t = useTranslations("SessionDetail");
  const td = useTranslations("TutorDashboard");
  const router = useRouter();
  const { toast } = useToast();
  const [forms, setForms] = useState<
    Record<number, { status: string; reason: string }>
  >({});
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const setStatus = (id: number, status: string) =>
    setForms((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { reason: "" }), status },
    }));

  const setReason = (id: number, reason: string) =>
    setForms((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { status: "" }), reason },
    }));

  const handleSubmit = async (participantId: number) => {
    const form = forms[participantId];
    if (!form?.status) {
      toast({ title: t("attendance.selectStatusError"), variant: "destructive" });
      return;
    }
    setLoadingId(participantId);
    try {
      const res = await markStudentAttendanceByTutor(
        participantId,
        parseInt(form.status) as AttendanceStatus,
        form.reason || undefined,
      );
      if (!res.ok) throw new Error(res.error);
      setSavedIds((prev) => new Set(prev).add(participantId));
      toast({ title: t("toast.attendanceSaved") });
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setForms({});
          setSavedIds(new Set());
          setLoadingId(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          {td("missingData.perStudentHint")}
        </p>
        <div className="space-y-4">
          {participants.map((p) => {
            const isSaved = savedIds.has(p.id);
            return (
              <div key={p.id} className={`border rounded-lg p-4 space-y-3 ${isSaved ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{p.studentName}</p>
                  {isSaved && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {td("missingData.saved")}
                    </span>
                  )}
                </div>
                {isSaved ? (
                  <div className="text-xs text-muted-foreground">
                    {attendanceLabel(
                      parseInt(forms[p.id]?.status ?? ""),
                      t,
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>{t("attendance.statusLabel")}</Label>
                      <Select
                        value={forms[p.id]?.status ?? ""}
                        onValueChange={(v) => setStatus(p.id, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("attendance.selectPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AttendanceStatus.ATTENDED.toString()}>
                            {t("attendance.statusPresent")}
                          </SelectItem>
                          <SelectItem value={AttendanceStatus.LATE.toString()}>
                            {t("attendance.statusLate")}
                          </SelectItem>
                          <SelectItem value={AttendanceStatus.ABSENT_EXCUSED.toString()}>
                            {t("attendance.statusAbsentExcused")}
                          </SelectItem>
                          <SelectItem value={AttendanceStatus.ABSENT_UNEXCUSED.toString()}>
                            {t("attendance.statusAbsentUnexcused")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("attendance.reasonLabel")}</Label>
                      <Textarea
                        value={forms[p.id]?.reason ?? ""}
                        onChange={(e) => setReason(p.id, e.target.value)}
                        rows={2}
                        placeholder={t("attendance.reasonPlaceholder")}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(p.id)}
                      disabled={loadingId !== null}
                      className="w-full sm:w-auto"
                    >
                      {loadingId === p.id && (
                        <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                      )}
                      {t("attendance.submitButton")}
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("closeButton")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function attendanceLabel(
  status: number,
  t: ReturnType<typeof useTranslations<"SessionDetail">>,
) {
  const labels: Record<number, string> = {
    [AttendanceStatus.ATTENDED]: t("attendance.statusPresent"),
    [AttendanceStatus.LATE]: t("attendance.statusLate"),
    [AttendanceStatus.ABSENT_EXCUSED]: t("attendance.statusAbsentExcused"),
    [AttendanceStatus.ABSENT_UNEXCUSED]: t("attendance.statusAbsentUnexcused"),
  };
  return labels[status] ?? "";
}