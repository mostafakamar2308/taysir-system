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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/actions/sessions";
import dayjs from "@/lib/dayjs";

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  studentName: string;
  tutors: { id: number; name: string | null }[];
  preselectedTutorId?: number | null;
  sessionsRemaining?: number | null;
}

export default function AddSessionDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  tutors,
  preselectedTutorId,
  sessionsRemaining,
}: AddSessionDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tutorId, setTutorId] = useState<string>(
    preselectedTutorId ? String(preselectedTutorId) : "",
  );
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isTrial, setIsTrial] = useState(false);

  const lowBalance =
    !isTrial && sessionsRemaining != null && sessionsRemaining <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await createSession({
        studentId,
        tutorId: parseInt(tutorId),
        date,
        startTime: dayjs(`${date}T${startTime}`).utc().toISOString(),
        duration,
        topic: topic || undefined,
        notes: notes || undefined,
        isTrial,
      });
      toast({ title: "تم إضافة الحصة" });
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
    <Dialog
      key={open ? "open" : "closed"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة حصة خاصة للطالب {studentName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student (fixed) */}
          <div className="space-y-2">
            <Label>الطالب</Label>
            <div className="rounded-md border px-3 py-2 text-sm bg-muted/40">
              {studentName}
            </div>
          </div>

          {/* Tutor selection – preselected from the student's group */}
          <div className="space-y-2">
            <Label>المعلم *</Label>
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
          </div>

          {/* Low balance warning */}
          {lowBalance && (
            <Alert
              variant="destructive"
              className="border-red-300 bg-red-50 dark:bg-red-900/10"
            >
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300 text-xs">
                تحذير: لا توجد حصص متبقية للطالب في الاشتراك الحالي. قد تزيد
                الحصة من المبلغ المستحق عليه.
              </AlertDescription>
            </Alert>
          )}

          {/* Date & Time */}
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
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min={15}
            />
          </div>

          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
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
              {loading ? "جاري الإنشاء..." : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
