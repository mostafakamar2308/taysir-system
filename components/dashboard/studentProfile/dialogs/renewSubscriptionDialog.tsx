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
import { renewSubscription } from "@/actions/studentFinances";
import { SubscriptionFinancial } from "@/types/studentFinances";

interface Props {
  subscription: SubscriptionFinancial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function RenewSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  // Mounted fresh each time it opens, so initial state reflects the current subscription.
  const defaultStart =
    subscription.nextBillingDate ??
    subscription.endDate ??
    dayjs().add(1, "day").format("YYYY-MM-DD");

  const [price, setPrice] = useState(subscription.price.toString());
  const [sessionCount, setSessionCount] = useState(
    subscription.sessionCount != null ? subscription.sessionCount.toString() : "",
  );
  const [billingCycle, setBillingCycle] = useState(
    subscription.billingCycle.toString(),
  );
  const [startDate, setStartDate] = useState(dayjs(defaultStart).format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);

  const remainingSessions =
    subscription.sessionsRemaining != null && subscription.sessionsRemaining > 0
      ? subscription.sessionsRemaining
      : 0;

  const enteredCount = sessionCount ? parseInt(sessionCount) : NaN;
  const baseCount = Number.isFinite(enteredCount)
    ? enteredCount
    : (subscription.sessionCount ?? 0);
  const carriedTotal = baseCount + remainingSessions;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await renewSubscription(subscription.id, {
        price: parseFloat(price),
        sessionCount: sessionCount ? parseInt(sessionCount) : null,
        billingCycle: parseInt(billingCycle) || 30,
        startDate,
      });
      if (!res.ok) throw new Error(res.error);
      toast.success("تم تجديد الاشتراك والحفاظ على السجل السابق");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تجديد الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تجديد اشتراك {subscription.groupTitle}</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الاشتراك الحالي</span>
            <span>
              {subscription.sessionCount ?? "—"} حصة /{" "}
              {subscription.price} {subscription.currencySymbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الفوترة القادم</span>
            <span>
              {subscription.nextBillingDate
                ? dayjs(subscription.nextBillingDate).format("YYYY-MM-DD")
                : "—"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            سيتم إنهاء دورة الاشتراك الحالية وإنشاء دورة جديدة مع الحفاظ على
            سجل المدفوعات السابق.
          </p>
          {remainingSessions > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 p-2 text-xs mt-1">
              سيتم ترحيل {remainingSessions} حصة متبقية من الدورة الحالية
              وإضافتها إلى عدد حصص الاشتراك الجديد.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>السعر ({subscription.currencySymbol})</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>عدد الحصص</Label>
              <Input
                type="number"
                value={sessionCount}
                onChange={(e) => setSessionCount(e.target.value)}
              />
              {remainingSessions > 0 && (
                <p className="text-xs text-muted-foreground">
                  الإجمالي بعد الترحيل: {carriedTotal} حصة
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>دورة الفوترة (أيام)</Label>
              <Input
                type="number"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ البدء/التجديد</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "جارٍ التجديد..." : "تأكيد التجديد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
