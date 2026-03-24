"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { recordPayment } from "@/actions/student";
import { PaymentMethod } from "@/types/payment";
import { paymentMethodLabels } from "@/lib/enums";

interface SubscriptionOption {
  id: number;
  planTitle: string;
  startDate: string;
}

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  subscriptions: SubscriptionOption[];
  activeSubscriptionId?: number;
}

export default function RecordPaymentDialog({
  open,
  onOpenChange,
  studentId,
  subscriptions,
  activeSubscriptionId,
}: RecordPaymentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string>(
    activeSubscriptionId?.toString() || "",
  );

  useEffect(() => {
    if (activeSubscriptionId)
      setSubscriptionId(activeSubscriptionId?.toString());
  }, [activeSubscriptionId]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!subscriptionId || !amount || !method) {
      toast({ title: "الرجاء ملء جميع الحقول", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await recordPayment(
        studentId,
        parseInt(subscriptionId),
        parseFloat(amount),
        parseInt(method),
        description || undefined,
      );
      toast({ title: "تم تسجيل الدفعة بنجاح" });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>الاشتراك</Label>
            <Select
              value={subscriptionId.toString()}
              onValueChange={setSubscriptionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الاشتراك" />
              </SelectTrigger>
              <SelectContent>
                {subscriptions.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id.toString()}>
                    {sub.planTitle} - {formatDate(sub.startDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المبلغ</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>طريقة الدفع</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="اختر" />
              </SelectTrigger>
              <SelectContent>
                {[
                  PaymentMethod.CASH,
                  PaymentMethod.CARD,
                  PaymentMethod.BANK_TRANSFER,
                  PaymentMethod.ONLINE,
                ].map((val) => (
                  <SelectItem key={val} value={val.toString()}>
                    {paymentMethodLabels[val]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الوصف (اختياري)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف الدفعة"
            />
          </div>
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
            {loading ? "جاري الحفظ..." : "تسجيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
