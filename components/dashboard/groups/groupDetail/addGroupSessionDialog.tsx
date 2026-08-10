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

interface AddGroupSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  defaultTutorId: number;
  tutors: { id: number; name: string | null }[];
  members: { id: number; name: string; sessionsRemaining: number | null }[];
}

export default function AddGroupSessionDialog({
  open,
  onOpenChange,
  groupId,
  defaultTutorId,
  tutors,
  members,
}: AddGroupSessionDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState(
    defaultTutorId.toString(),
  );
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isTrial, setIsTrial] = useState(false);

  const resetForm = () => {
    setSelectedTutorId(defaultTutorId.toString());
    setDate(dayjs().format("YYYY-MM-DD"));
    setStartTime("09:00");
    setDuration(60);
    setTopic("");
    setNotes("");
    setIsTrial(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) resetForm();
    onOpenChange(next);
  };

  const lowBalanceMembers = isTrial
    ? []
    : members.filter(
        (m) => m.sessionsRemaining != null && m.sessionsRemaining <= 0,
      );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const startISO = dayjs(`${date}T${startTime}`).utc().toISOString();
      await createSession({
        groupId,
        tutorId: parseInt(selectedTutorId),
        date,
        startTime: startISO,
        duration,
        topic: topic || undefined,
        notes: notes || undefined,
        isTrial,
      });
      toast({ title: "تم إنشاء الحصة" });
      onOpenChange(false);
      router.refresh();
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة حصة للمجموعة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>المعلم</Label>
            <Select
              value={selectedTutorId}
              onValueChange={setSelectedTutorId}
              required
            >
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
          </div>

          {lowBalanceMembers.length > 0 && (
            <Alert
              variant="destructive"
              className="border-red-300 bg-red-50 dark:bg-red-900/10"
            >
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300 text-xs">
                تحذير: الطلاب التاليون لا توجد حصص متبقية في اشتراكهم الحالي:
                <ul className="list-disc list-inside mt-1">
                  {lowBalanceMembers.map((m) => (
                    <li key={m.id}>{m.name}</li>
                  ))}
                </ul>
                يُنصح بتجديد الاشتراك.
              </AlertDescription>
            </Alert>
          )}

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
