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
import { bulkChangeStatus } from "@/actions/student";
import { StudentStatus } from "@/types/student";

interface BulkChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentIds: number[];
  plans: { id: number; title: string }[];
  onSuccess?: () => void;
}

const statusLabels: Record<number, string> = {
  [StudentStatus.lead]: "عميل محتمل",
  [StudentStatus.trial]: "تجريبي",
  [StudentStatus.subscribed]: "مشترك",
  [StudentStatus.churned]: "منسحب",
  [StudentStatus.paused]: "متوقف",
};

export default function BulkChangeStatusDialog({
  open,
  onOpenChange,
  studentIds,
  plans,
  onSuccess,
}: BulkChangeStatusDialogProps) {
  const [status, setStatus] = useState<string>("");
  const [planId, setPlanId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      toast({ title: "الرجاء اختيار حالة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await bulkChangeStatus(
        studentIds,
        parseInt(status),
        planId !== "none" ? parseInt(planId) : undefined,
      );
      toast({ title: "تم تغيير حالة الطلاب المحددين" });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isSubscribed = status === String(StudentStatus.subscribed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            تغيير حالة الطلاب المحددين ({studentIds.length})
          </DialogTitle>
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

          {isSubscribed && (
            <div className="space-y-2">
              <Label>الخطة (للمشتركين)</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخطة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون خطة</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
