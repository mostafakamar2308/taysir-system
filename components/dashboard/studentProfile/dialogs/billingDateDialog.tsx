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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import dayjs from "@/lib/dayjs";
import { setStudentBillingDate } from "@/actions/studentFinances";

interface Props {
  studentId: number;
  billingDate: string | null;
  derivedBillingDate: string | null;
  billingDateSource: "custom" | "derived";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function BillingDateDialog({
  studentId,
  billingDate,
  derivedBillingDate,
  billingDateSource,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  // Mounted fresh each time it opens, so initial state reflects current props.
  const [date, setDate] = useState(
    billingDate ? dayjs(billingDate).format("YYYY-MM-DD") : "",
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!date) {
      toast.error("اختر تاريخًا");
      return;
    }
    setLoading(true);
    try {
      await setStudentBillingDate(studentId, date);
      toast.success("تم ضبط تاريخ الفوترة");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ التاريخ");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await setStudentBillingDate(studentId, null);
      toast.success("تمت إعادة تاريخ الفوترة إلى الافتراضي");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ التاريخ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل تاريخ الفوترة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">التاريخ الافتراضي</span>
              <span className="font-medium">
                {derivedBillingDate
                  ? dayjs(derivedBillingDate).format("YYYY-MM-DD")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الحالة الحالية</span>
              <span className="font-medium">
                {billingDateSource === "custom" ? "مخصص (يدوي)" : "افتراضي"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>تاريخ الفوترة المخصص</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            بمجرد اختيار تاريخ يدوي، سيتم الاحتفاظ به ولن يتم إعادة احتسابه عند
            إضافة اشتراكات جديدة.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClear} disabled={loading}>
            العودة للافتراضي
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
