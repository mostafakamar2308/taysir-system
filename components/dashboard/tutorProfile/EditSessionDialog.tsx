"use client";

import { useState, useEffect } from "react";
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

import { useToast } from "@/hooks/use-toast";
import { updateSession } from "@/actions/sessions";
import { getSessionFormOptions } from "@/actions/sessions";
import type { TutorSessionCardData } from "@/types/tutor";
import dayjs from "@/lib/dayjs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: TutorSessionCardData;
  academyId: number;
  tutorId?: number; // restrict to self
}

export function TutorEditSessionDialog({
  open,
  onOpenChange,
  session,
  academyId,
  tutorId,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<{ id: number; name: string }[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState(
    tutorId?.toString() ?? "",
  );
  const [date, setDate] = useState(
    dayjs(session.startTime).format("YYYY-MM-DD"),
  );
  const [startTime, setStartTime] = useState(
    dayjs(session.startTime).format("HH:mm"),
  );
  const [duration, setDuration] = useState(session.durationMinutes);
  const [topic, setTopic] = useState(session.topic || "");
  const [notes, setNotes] = useState("");
  const [isTrial, setIsTrial] = useState(false); // need to get from session? We don't have that field; add to card data or just default false.
  const isPast = dayjs(session.startTime).isBefore(dayjs());

  useEffect(() => {
    if (open) {
      getSessionFormOptions(academyId, tutorId)
        .then((data) => setTutors(data.tutors))
        .catch(console.error);
    }
  }, [open, academyId, tutorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSession({
        id: session.sessionId,
        topic,
        notes,
        isTrial,
        tutorId: parseInt(selectedTutorId),
        ...(isPast
          ? {}
          : {
              date,
              startTime: dayjs(`${date}T${startTime}`).utc().toISOString(),
              duration,
            }),
      });
      toast({ title: "تم تحديث الحصة" });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error)
        toast({
          title: "خطأ",
          description: err.message,
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
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الحصة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>المجموعة</Label>
            <Input value={session.groupName} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>المعلم</Label>
            <Select
              value={selectedTutorId}
              onValueChange={setSelectedTutorId}
              disabled={!!tutorId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isPast && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>وقت البدء</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
          )}
          {!isPast && (
            <div className="space-y-2">
              <Label>المدة (دقيقة)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min={15}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

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
              {loading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
