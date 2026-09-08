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
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateSession } from "@/actions/sessions";
import { getSessionFormOptions } from "@/actions/sessions";
import type { AdminSession } from "@/types/session";
import dayjs from "@/lib/dayjs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: AdminSession;
  academyId: number;
  canEditSessionTime?: boolean;
  canEditDuration?: boolean;
}

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  academyId,
  canEditSessionTime = true,
  canEditDuration = true,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<{ id: number; name: string }[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState(
    session.tutorId.toString(),
  );
  const [originalTutorId] = useState(session.tutorId);
  const [date, setDate] = useState(
    dayjs(session.startTime).format("YYYY-MM-DD"),
  );
  const [startTime, setStartTime] = useState(
    dayjs(session.startTime).format("HH:mm"),
  );
  const [duration, setDuration] = useState(session.durationMinutes);
  const [topic, setTopic] = useState(session.topic || "");
  const [isTrial, setIsTrial] = useState(session.isTrial);
  const [notes, setNotes] = useState("");
  const isPast = dayjs(session.startTime).isBefore(dayjs());

  useEffect(() => {
    if (open) {
      getSessionFormOptions(academyId)
        .then((res) => {
          if (res.ok) setTutors(res.data?.tutors ?? []);
        })
        .catch(console.error);
    }
  }, [open, academyId]);

  const tutorMismatch = parseInt(selectedTutorId) !== originalTutorId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateSession({
        id: session.id,
        topic,
        isTrial,
        tutorId: parseInt(selectedTutorId),
        ...(canEditSessionTime && !isPast
          ? {
              date,
              startTime: dayjs(`${date}T${startTime}`).utc().toISOString(),
            }
          : {}),
        ...(canEditSessionTime && canEditDuration && !isPast
          ? { duration }
          : {}),
      });
      if (!res.ok) throw new Error(res.error);
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
          {/* Group name (disabled) */}
          <div className="space-y-2">
            <Label>المجموعة</Label>
            <Input value={session.groupName} disabled className="bg-muted" />
          </div>

          {/* Tutor */}
          <div className="space-y-2">
            <Label>المعلم</Label>
            <Combobox
              options={tutors.map((t) => ({
                value: t.id.toString(),
                label: t.name,
              }))}
              value={selectedTutorId}
              onValueChange={setSelectedTutorId}
              placeholder="اختر المعلم"
            />
            {tutorMismatch && (
              <Alert
                variant="warning"
                className="mt-2 border-amber-300 bg-amber-50"
              >
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-xs">
                  هذا التغيير سيُطبق على هذه الحصة فقط.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Time (editable only if future) */}
          {!isPast && canEditSessionTime && (
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
          {!isPast && canEditSessionTime && canEditDuration && (
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
