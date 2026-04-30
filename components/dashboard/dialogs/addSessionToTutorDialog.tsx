"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/actions/sessions";
import { Plus } from "lucide-react";
import dayjs from "@/lib/dayjs";

interface AddSessionDialogProps {
  tutorId: number;
  studentOptions: { id: number; name: string }[];
  academyId: number;
  children?: React.ReactNode;
}

export default function AddSessionDialog({
  tutorId,
  studentOptions,
  academyId,
  children,
}: AddSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const [recurEndDate, setRecurEndDate] = useState("");

  const dayOptions = [
    { value: 0, label: "الأحد" },
    { value: 1, label: "الاثنين" },
    { value: 2, label: "الثلاثاء" },
    { value: 3, label: "الأربعاء" },
    { value: 4, label: "الخميس" },
    { value: 5, label: "الجمعة" },
    { value: 6, label: "السبت" },
  ];

  const toggleRecurDay = (day: number) => {
    setRecurDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !date || !startTime) {
      toast({
        title: "يرجى اختيار الطالب وإدخال التاريخ والوقت",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const input = {
        studentId: parseInt(studentId),
        tutorId,
        academyId,
        date,
        startTime,
        duration: parseInt(duration),
        topic: topic || undefined,
        notes: notes || undefined,
        isRecurring,
        recurDays: isRecurring ? recurDays : undefined,
        recurEndDate: isRecurring ? recurEndDate : undefined,
      };
      await createSession({
        ...input,
        startTime: dayjs(`${input.date}T${input.startTime}`).toISOString(),
      });
      toast({ title: "تمت إضافة الحصة" });
      router.refresh();
    } catch (error) {
      console.log(error);

      if (error instanceof Error)
        toast({
          title: "حدث خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> إضافة حصة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة حصة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>الطالب *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الطالب" />
              </SelectTrigger>
              <SelectContent>
                {studentOptions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          {/* Recurring */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">حصة متكررة</Label>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
