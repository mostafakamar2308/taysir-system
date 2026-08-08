"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { changeStudentStatus } from "@/actions/student";
import { StudentStatus } from "@/types/student";

interface ChangeStatusDialogProps {
  studentId: number;
  studentName: string;
  currentStatus: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<number, string> = {
  [StudentStatus.lead]: "عميل محتمل",
  [StudentStatus.trial]: "تجريبي",
  [StudentStatus.subscribed]: "مشترك",
  [StudentStatus.churned]: "منسحب",
  [StudentStatus.paused]: "متوقف",
};

export default function ChangeStatusDialog({
  studentId,
  studentName,
  currentStatus,
  open,
  onOpenChange,
}: ChangeStatusDialogProps) {
  const [status, setStatus] = useState(String(currentStatus));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changeStudentStatus(
        studentId,
        parseInt(status),
        note || undefined,
      );

      toast({ title: "تم تغيير الحالة" });
      onOpenChange(false);
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تغيير حالة الطالب</DialogTitle>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>الحالة الجديدة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ملاحظة (اختياري)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أضف ملاحظة حول تغيير الحالة..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "تأكيد"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
