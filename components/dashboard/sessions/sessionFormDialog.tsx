"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSession, updateSession } from "@/actions/sessions";
import { DashboardSession } from "@/types/session";
import dayjs from "@/lib/dayjs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: DashboardSession | null;
  prefillSlot: { date: Date; hour: number } | null;
  students: { id: number; name: string; tutorId: number | null }[];
  tutors: { id: number; name: string | null }[];
  academyId: number;
  onSave: () => void; // callback after successful save
}

const dayOptions = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

export function SessionFormDialog({
  open,
  onOpenChange,
  session,
  prefillSlot,
  students,
  tutors,
  academyId,
  onSave,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!session;

  // Form state
  const [studentId, setStudentId] = useState<string>("");
  const [tutorId, setTutorId] = useState<string>("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("30");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const [recurEndDate, setRecurEndDate] = useState("");
  const [isTrial, setIsTrial] = useState(false);
  const [editScope, setEditScope] = useState<"this" | "future" | "all">("this");
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [overrideConflicts, setOverrideConflicts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if the student already has a tutor (for read‑only display)
  const currentStudent = students.find((s) => s.id.toString() === studentId);
  const currentTutorId = currentStudent?.tutorId ?? null;
  const hasCurrentTutor = !!currentTutorId;
  const selectedTutorName = tutors.find((t) => t.id === currentTutorId)?.name;

  // Prefill on open
  useEffect(() => {
    if (session) {
      const d = new Date(session.startTime);
      setStudentId(session.studentId.toString());
      setTutorId(session.tutorId.toString());
      setDate(dayjs(d).format("YYYY-MM-DD"));
      setStartTime(dayjs(d).format("HH:mm"));
      setDuration(session.durationMinutes.toString());
      setTopic(session.topic || "");
      setNotes(session.notes || "");
      setIsRecurring(!!session.recurringPatternId);
      setIsTrial(session.isTrial ?? false);
    } else if (prefillSlot) {
      const d = prefillSlot.date;
      setDate(dayjs(d).format("YYYY-MM-DD"));
      setStartTime(`${prefillSlot.hour.toString().padStart(2, "0")}:00`);
      setStudentId("");
      setTutorId("");
      setDuration("30");
      setTopic("");
      setNotes("");
      setIsRecurring(false);
      setIsTrial(false);
    } else {
      // Reset
      setStudentId("");
      setTutorId("");
      setDate("");
      setStartTime("09:00");
      setDuration("30");
      setTopic("");
      setNotes("");
      setIsRecurring(false);
      setIsTrial(false);
    }
    setRecurDays([]);
    setRecurEndDate("");
    setConflicts([]);
    setOverrideConflicts(false);
    setEditScope("this");
  }, [session, prefillSlot, open]);

  // Conflict detection (simplified – in real app you'd fetch from server)
  // We'll skip actual conflict check here and rely on server-side validation.

  const endTime = useMemo(() => {
    if (!startTime) return "";
    const [h, m] = startTime.split(":").map(Number);
    const end = dayjs().hour(h).minute(m).add(parseInt(duration), "minute");
    return end.format("HH:mm");
  }, [startTime, duration]);

  const handleSubmit = async () => {
    if (!studentId || !tutorId || !date || !startTime) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const input = {
        studentId: parseInt(studentId),
        tutorId: parseInt(tutorId),
        academyId,
        date,
        startTime,
        duration: parseInt(duration),
        topic: topic || undefined,
        notes: notes || undefined,
        isRecurring,
        recurDays: isRecurring ? recurDays : undefined,
        recurEndDate: isRecurring ? recurEndDate : undefined,
        isTrial,
      };

      if (isEdit) {
        await updateSession({
          id: session.id,
          ...input,
          scope: editScope,
          startTime: dayjs(`${input.date}T${input.startTime}`).toISOString(),
        });
        toast({ title: "تم تعديل الحصة بنجاح" });
      } else {
        await createSession({
          ...input,
          startTime: dayjs(`${input.date}T${input.startTime}`).toISOString(),
        });
        toast({ title: "تم إضافة الحصة بنجاح" });
      }

      onSave();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({ title: error?.message || "حدث خطأ", variant: "destructive" });
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRecurDay = (day: number) => {
    setRecurDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "تعديل الحصة" : "إضافة حصة جديدة"}
          </DialogTitle>
        </DialogHeader>

        {isEdit && session?.recurringPatternId && (
          <div className="flex gap-2 p-3 rounded-lg bg-accent/50 border border-border">
            <RefreshCw className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground">
                هذه حصة متكررة. اختر نطاق التعديل:
              </p>
              <div className="flex flex-wrap gap-2">
                {(["this", "future", "all"] as const).map((scope) => (
                  <Badge
                    key={scope}
                    variant={editScope === scope ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setEditScope(scope)}
                  >
                    {scope === "this"
                      ? "هذه فقط"
                      : scope === "future"
                        ? "هذه والمستقبلية"
                        : "جميع الحصص"}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Student and Tutor selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الطالب *</Label>
              {isEdit ? (
                <Input
                  value={
                    students.find((s) => s.id.toString() === studentId)?.name ||
                    ""
                  }
                  disabled
                  className="bg-muted"
                />
              ) : (
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {isEdit && (
                <input type="hidden" name="studentId" value={studentId} />
              )}
            </div>
            <div className="space-y-2">
              <Label>المعلم *</Label>
              {isEdit || hasCurrentTutor ? (
                <Input
                  value={
                    isEdit
                      ? tutors.find((t) => t.id.toString() === tutorId)?.name ||
                        ""
                      : selectedTutorName || ""
                  }
                  disabled
                  className="bg-muted"
                />
              ) : (
                <Select value={tutorId} onValueChange={setTutorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {isEdit && <input type="hidden" name="tutorId" value={tutorId} />}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>وقت البدء *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>المدة (دقيقة)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 20, 25, 30, 45, 60, 90].map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m} دقيقة
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {endTime && (
            <p className="text-xs text-muted-foreground">
              وقت الانتهاء: {endTime}
            </p>
          )}

          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: سورة البقرة - الآيات 1-20"
            />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات للمعلم..."
              rows={2}
            />
          </div>

          {/* Trial session checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="trial"
              checked={isTrial}
              onCheckedChange={(v) => setIsTrial(v === true)}
            />
            <Label
              htmlFor="trial"
              className="text-sm font-normal cursor-pointer"
            >
              حصة تجريبية
            </Label>
          </div>

          {/* Recurring */}
          {!isEdit && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  حصة متكررة
                </Label>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>
              {isRecurring && (
                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      أيام التكرار
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dayOptions.map((d) => (
                        <Badge
                          key={d.value}
                          variant={
                            recurDays.includes(d.value) ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleRecurDay(d.value)}
                        >
                          {d.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      تاريخ الانتهاء (اختياري)
                    </Label>
                    <Input
                      type="date"
                      value={recurEndDate}
                      onChange={(e) => setRecurEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conflicts (simplified) – in real app you'd show server errors */}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "جاري الحفظ..."
              : isEdit
                ? "حفظ التعديلات"
                : "إضافة الحصة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
