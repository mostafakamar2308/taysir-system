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
import { updateSubscription } from "@/actions/groups";
import { SubscriptionFinancial } from "@/types/studentFinances";

interface Props {
  subscription: SubscriptionFinancial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  // Mounted fresh each time it opens, so initial state reflects the current subscription.
  const [price, setPrice] = useState(subscription.price.toString());
  const [sessionCount, setSessionCount] = useState(
    subscription.sessionCount != null ? subscription.sessionCount.toString() : "",
  );
  const [billingCycle, setBillingCycle] = useState(
    subscription.billingCycle.toString(),
  );
  const [nextBillingDate, setNextBillingDate] = useState(
    subscription.nextBillingDate
      ? dayjs(subscription.nextBillingDate).format("YYYY-MM-DD")
      : "",
  );
  const [endDate, setEndDate] = useState(
    subscription.endDate
      ? dayjs(subscription.endDate).format("YYYY-MM-DD")
      : "",
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await updateSubscription(subscription.id, {
        price: parseFloat(price),
        sessionCount: sessionCount ? parseInt(sessionCount) : null,
        billingCycle: parseInt(billingCycle) || undefined,
        nextBillingDate: nextBillingDate || null,
        endDate: endDate || null,
      });
      if (!res.ok) throw new Error(res.error);
      toast.success("تم تحديث الاشتراك");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تحديث الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل اشتراك {subscription.groupTitle}</DialogTitle>
        </DialogHeader>

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
            </div>
          </div>

          <div className="space-y-2">
            <Label>دورة الفوترة (أيام)</Label>
            <Input
              type="number"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>تاريخ الفوترة القادم</Label>
              <Input
                type="date"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
