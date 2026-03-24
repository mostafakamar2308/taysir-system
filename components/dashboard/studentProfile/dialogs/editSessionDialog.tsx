"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { updateSession } from "@/actions/sessions";
import dayjs from "@/lib/dayjs";

interface EditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    topic?: string | null;
    notes?: string | null;
  };
}

export default function EditSessionDialog({
  open,
  onOpenChange,
  session,
}: EditSessionDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(session.durationMinutes.toString());
  const [topic, setTopic] = useState(session.topic ?? "");
  const [notes, setNotes] = useState(session.notes ?? "");

  useEffect(() => {
    if (session) {
      const start = dayjs(session.startTime);
      setDate(start.format("YYYY-MM-DD"));
      setStartTime(start.format("HH:mm"));
      setDuration(session.durationMinutes.toString());
      setTopic(session.topic ?? "");
      setNotes(session.notes ?? "");
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime) {
      toast({ title: "يرجى إدخال التاريخ والوقت", variant: "destructive" });
      return;
    }
    const start = dayjs(`${date}T${startTime}`);
    setLoading(true);
    try {
      await updateSession({
        id: session.id,
        startTime: start.toISOString(),
        duration: parseInt(duration),
        topic: topic,
        notes: notes,
      });
      toast({ title: "تم تحديث الحصة" });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الحصة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>وقت البدء</Label>
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
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
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
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
