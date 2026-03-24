"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { updateStudentSessionAttendance } from "@/actions/sessions";
import { AttendanceStatus } from "@/types/session";
import { attendanceStatusLabels } from "@/lib/enums";

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
  currentStatus?: number;
  currentReason?: string | null;
}

export default function AttendanceDialog({
  open,
  onOpenChange,
  sessionId,
  currentStatus,
  currentReason,
}: AttendanceDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>(currentStatus?.toString() ?? "");
  const [reason, setReason] = useState(currentReason ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!status) {
      toast({ title: "يرجى اختيار حالة الحضور", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await updateStudentSessionAttendance(
        sessionId,
        parseInt(status),
        reason || undefined,
      );
      toast({ title: "تم تحديث الحضور" });
      onOpenChange(false);
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
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل حضور الطالب</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>حالة الحضور</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(attendanceStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(status === AttendanceStatus.ABSENT_EXCUSED.toString() ||
            status === AttendanceStatus.ABSENT_UNEXCUSED.toString()) && (
            <div className="space-y-2">
              <Label>السبب</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سبب الغياب..."
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
