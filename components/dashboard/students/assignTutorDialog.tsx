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
import { useToast } from "@/hooks/use-toast";
import { assignTutor } from "@/actions/student";

interface AssignTutorDialogProps {
  studentId: number;
  studentName: string;
  currentTutorId?: number;
  tutors: { id: number; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssignTutorDialog({
  studentId,
  studentName,
  currentTutorId,
  tutors,
  open,
  onOpenChange,
}: AssignTutorDialogProps) {
  const [tutorId, setTutorId] = useState(
    currentTutorId ? String(currentTutorId) : "none",
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await assignTutor(
        studentId,
        tutorId === "none" ? null : parseInt(tutorId),
      );
      toast({ title: "تم تعيين المعلم" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعيين معلم للطالب</DialogTitle>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>المعلم</Label>
            <Select value={tutorId.toString()} onValueChange={setTutorId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المعلم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون معلم</SelectItem>
                {tutors.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
