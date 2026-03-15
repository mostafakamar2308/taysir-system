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
import { bulkAssignTutor } from "@/actions/student";

interface BulkAssignTutorDialogProps {
  studentIds: number[];
  tutors: { id: number; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function BulkAssignTutorDialog({
  studentIds,
  tutors,
  open,
  onOpenChange,
  onSuccess,
}: BulkAssignTutorDialogProps) {
  const [tutorId, setTutorId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tutorId === "none") {
      toast({ title: "الرجاء اختيار معلم", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await bulkAssignTutor(studentIds, parseInt(tutorId));
      toast({
        title: "تم تعيين المعلمين",
        description: `تم تعيين معلم لـ ${studentIds.length} طالب`,
      });
      onOpenChange(false);
      onSuccess?.();
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
          <DialogTitle>تعيين معلم للطلاب المحددين</DialogTitle>
          <p className="text-sm text-muted-foreground">
            عدد الطلاب: {studentIds.length}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>المعلم</Label>
            <Select value={tutorId} onValueChange={setTutorId}>
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
