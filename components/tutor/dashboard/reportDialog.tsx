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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { upsertSessionReport } from "@/actions/tutor/report";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { SessionParticipantSummary } from "./types";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  participants: SessionParticipantSummary[];
}

interface ReportFields {
  rating: string;
  outcomes: string;
  strengths: string;
  weaknesses: string;
  nextGoals: string;
  comments: string;
}

const EMPTY_FIELDS: ReportFields = {
  rating: "",
  outcomes: "",
  strengths: "",
  weaknesses: "",
  nextGoals: "",
  comments: "",
};

export default function ReportDialog({
  open,
  onOpenChange,
  title,
  participants,
}: ReportDialogProps) {
  const t = useTranslations("SessionDetail");
  const td = useTranslations("TutorDashboard");
  const router = useRouter();
  const { toast } = useToast();
  const [forms, setForms] = useState<Record<number, ReportFields>>({});
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const setField = (id: number, field: keyof ReportFields, value: string) =>
    setForms((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? EMPTY_FIELDS), [field]: value },
    }));

  const handleSubmit = async (participantId: number) => {
    const f = forms[participantId];
    if (!f || (!f.outcomes && !f.strengths && !f.weaknesses && !f.nextGoals)) {
      toast({ title: t("report.missingFieldsError"), variant: "destructive" });
      return;
    }
    setLoadingId(participantId);
    try {
      const res = await upsertSessionReport(participantId, {
        rating: f.rating ? parseInt(f.rating) : undefined,
        outcomes: f.outcomes || null,
        strengths: f.strengths || null,
        weaknesses: f.weaknesses || null,
        nextGoals: f.nextGoals || null,
        comments: f.comments || null,
      });
      if (!res.ok) throw new Error(res.error);
      setSavedIds((prev) => new Set(prev).add(participantId));
      toast({ title: t("toast.reportSaved") });
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
            const f = forms[p.id];
            const isSaved = savedIds.has(p.id);
            return (
              <div key={p.id} className={`border rounded-lg p-4 space-y-3 ${isSaved ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-sm">{p.studentName}</h5>
                  {isSaved && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {td("missingData.saved")}
                    </span>
                  )}
                </div>
                {!isSaved && (
                  <>
                    <div className="space-y-2">
                      <Label>{t("report.ratingLabel")}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={f?.rating ?? ""}
                        onChange={(e) => setField(p.id, "rating", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("report.outcomesLabel")} *</Label>
                      <Textarea
                        value={f?.outcomes ?? ""}
                        onChange={(e) => setField(p.id, "outcomes", e.target.value)}
                        rows={2}
                        placeholder={t("report.outcomesPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("report.strengthsLabel")}</Label>
                      <Textarea
                        value={f?.strengths ?? ""}
                        onChange={(e) => setField(p.id, "strengths", e.target.value)}
                        rows={2}
                        placeholder={t("report.strengthsPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("report.weaknessesLabel")}</Label>
                      <Textarea
                        value={f?.weaknesses ?? ""}
                        onChange={(e) => setField(p.id, "weaknesses", e.target.value)}
                        rows={2}
                        placeholder={t("report.weaknessesPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("report.nextGoalsLabel")} *</Label>
                      <Textarea
                        value={f?.nextGoals ?? ""}
                        onChange={(e) => setField(p.id, "nextGoals", e.target.value)}
                        rows={2}
                        placeholder={t("report.nextGoalsPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("report.commentsLabel")}</Label>
                      <Textarea
                        value={f?.comments ?? ""}
                        onChange={(e) => setField(p.id, "comments", e.target.value)}
                        rows={2}
                        placeholder={t("report.commentsPlaceholder")}
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
                      {t("report.submitButton")}
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