"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cancelSubscription } from "@/actions/groups";
import { SubscriptionFinancial } from "@/types/studentFinances";

interface Props {
  subscription: SubscriptionFinancial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function DeactivateSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await cancelSubscription(subscription.id);
      if (!res.ok) throw new Error(res.error);
      toast.success(`تم إلغاء اشتراك ${subscription.groupTitle}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل إلغاء الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>إلغاء اشتراك {subscription.groupTitle}</DialogTitle>
          <DialogDescription>
            سيتم إلغاء الاشتراك النشط في {subscription.groupTitle} فقط. لن يتم
            حذف أي مدفوعات أو حصص سابقة، وستظل البيانات متاحة في سجل الاشتراكات.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            تراجع
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
