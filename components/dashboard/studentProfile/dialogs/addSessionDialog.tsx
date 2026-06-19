"use client";

import { useState } from "react";
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

import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/actions/sessions";
import dayjs from "@/lib/dayjs";

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  studentName: string;
  tutors: { id: number; name: string | null }[];
  academyId: number;
  currentTutorId?: number | null;
}

export default function AddSessionDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  tutors,
  academyId,
  currentTutorId,
}: AddSessionDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tutorId, setTutorId] = useState<string>(
    currentTutorId ? String(currentTutorId) : "",
  );
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isTrial, setIsTrial] = useState(false);

  const hasCurrentTutor = !!currentTutorId;
  const selectedTutorName = tutors.find((t) => t.id === currentTutorId)?.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate tutor
    if (!tutorId) {
      toast({ title: "يرجى اختيار المعلم", variant: "destructive" });
      return;
    }
    if (!date || !startTime) {
      toast({ title: "يرجى إدخال التاريخ والوقت", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const input = {
        studentIds: [studentId],
        tutorId: parseInt(tutorId),
        academyId,
        date,
        startTime: dayjs(`${date}T${startTime}`).utc().toISOString(),
        duration: parseInt(duration),
        topic: topic || undefined,
        notes: notes || undefined,
        isTrial,
      };
      await createSession(input);
      toast({ title: "تمت إضافة الحصة" });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "حدث خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>
            {hasCurrentTutor
              ? `إضافة حصة للطالب ${studentName} مع المعلم ${selectedTutorName}`
              : `إضافة حصة للطالب ${studentName}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tutor selection – disabled if student already has a tutor */}
          <div className="space-y-2">
            <Label>المعلم *</Label>
            {hasCurrentTutor ? (
              <Input
                value={selectedTutorName || ""}
                disabled
                className="bg-muted"
              />
            ) : (
              <Select value={tutorId} onValueChange={setTutorId} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المعلم" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasCurrentTutor && (
              <input type="hidden" name="tutorId" value={tutorId} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>وقت البدء *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>المدة (دقيقة)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 20, 25, 30, 45, 60, 90].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} دقيقة
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              placeholder="ملاحظات..."
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
