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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { changeStudentStatusWithSubscription } from "@/actions/student";
import { StudentStatus } from "@/types/student";

interface ChangeStatusDialogProps {
  studentId: number;
  studentName: string;
  currentTutorId?: number;
  currentStatus: number;
  plans: { id: number; title: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutors?: {
    id: number;
    name: string;
  }[];
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
  plans,
  tutors,
  currentTutorId,
  open,
  onOpenChange,
}: ChangeStatusDialogProps) {
  const [status, setStatus] = useState(String(currentStatus));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSubscriptionFields, setShowSubscriptionFields] = useState(false);
  const [planId, setPlanId] = useState<string>("");
  const [tutorId, setTutorId] = useState<string | undefined>(
    currentTutorId?.toString(),
  );
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [paid, setPaid] = useState(true);
  const { toast } = useToast();

  // When status changes to subscribed, show subscription fields
  const handleStatusChange = (value: string) => {
    setStatus(value);
    setShowSubscriptionFields(value === String(StudentStatus.subscribed));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (status === String(StudentStatus.subscribed)) {
        if (!planId) {
          toast({ title: "الرجاء اختيار خطة", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (!startDate) {
          toast({ title: "الرجاء إدخال تاريخ البدء", variant: "destructive" });
          setLoading(false);
          return;
        }

        const subscriptionData = {
          planId: parseInt(planId),
          startDate: new Date(startDate),
          paid,
          tutorId: Number(tutorId),
        };
        await changeStudentStatusWithSubscription(
          studentId,
          parseInt(status),
          subscriptionData,
          note || undefined,
        );
      } else {
        await changeStudentStatusWithSubscription(
          studentId,
          parseInt(status),
          undefined,
          note || undefined,
        );
      }

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
            <Select value={status} onValueChange={handleStatusChange}>
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

          {showSubscriptionFields && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold">تفاصيل الاشتراك الجديد</h4>
              <div className="space-y-2">
                <Label>الخطة</Label>
                <Select value={planId} onValueChange={setPlanId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الخطة" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={String(plan.id)}>
                        {plan.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              {!currentTutorId && tutors ? (
                <div className="space-y-2">
                  <Label>المعلم</Label>
                  <Select
                    value={tutorId?.toString()}
                    onValueChange={setTutorId}
                  >
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
              ) : null}
              <div className="flex items-center gap-2">
                <Switch id="paid" checked={paid} onCheckedChange={setPaid} />
                <Label htmlFor="paid">دفع الاشتراك</Label>
              </div>
            </div>
          )}

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
