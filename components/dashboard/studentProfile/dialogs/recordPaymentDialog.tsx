"use client";

import { useMemo, useState } from "react";
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
import { toast } from "sonner";
import dayjs from "@/lib/dayjs";
import { PaymentMethod } from "@/types/payment";
import { paymentMethodLabels } from "@/lib/enums";
import { recordStudentPayment } from "@/actions/studentFinances";
import { SubscriptionFinancial } from "@/types/studentFinances";

interface Props {
  studentId: number;
  subscriptions: SubscriptionFinancial[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function formatMoney(amount: number, symbol: string): string {
  return `${amount.toLocaleString("ar-EG")} ${symbol}`;
}

export default function RecordPaymentDialog({
  studentId,
  subscriptions,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  // Mounted fresh each time it opens, so initial state reflects current props.
  const relevant = useMemo(
    () =>
      [...subscriptions]
        .filter((s) => s.outstanding > 0)
        .sort((a, b) => {
          const da = a.nextBillingDate ?? a.endDate ?? a.startDate;
          const db = b.nextBillingDate ?? b.endDate ?? b.startDate;
          return da.localeCompare(db);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const totalOutstanding = relevant.reduce((sum, s) => sum + s.outstanding, 0);
  const initialAllocations = Object.fromEntries(
    relevant.map((s) => [s.id, s.outstanding.toFixed(2)]),
  );

  const [amount, setAmount] = useState(totalOutstanding.toFixed(2));
  const [method, setMethod] = useState<string>(PaymentMethod.CASH.toString());
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [allocations, setAllocations] =
    useState<Record<number, string>>(initialAllocations);
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const allocatedTotal = Object.values(allocations).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0,
  );
  const remaining = parsedAmount - allocatedTotal;
  const valid = relevant.length > 0 && Math.abs(remaining) <= 0.01;

  const handleAutoDistribute = () => {
    let rest = parsedAmount;
    const next: Record<number, string> = {};
    for (const s of relevant) {
      const take = Math.max(0, Math.min(s.outstanding, rest));
      next[s.id] = take.toFixed(2);
      rest -= take;
    }
    setAllocations(next);
  };

  const handleSubmit = async () => {
    if (!valid) {
      toast.error("مجموع التوزيع لا يساوي المبلغ المدفوع");
      return;
    }
    setLoading(true);
    try {
      const res = await recordStudentPayment(studentId, {
        amount: parsedAmount,
        method: parseInt(method),
        date,
        allocations: relevant
          .map((s) => ({
            subscriptionId: s.id,
            amount: parseFloat(allocations[s.id] ?? "0") || 0,
          }))
          .filter((a) => a.amount > 0),
      });
      if (!res.ok) throw new Error(res.error);
      toast.success("تم تسجيل الدفعة");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تسجيل الدفعة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة</DialogTitle>
        </DialogHeader>

        {relevant.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            لا توجد مبالغ مستحقة لتسجيل دفعة عنها
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المبلغ المستلم</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PaymentMethod)
                      .filter((m) => typeof m === "number")
                      .map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          {paymentMethodLabels[m as PaymentMethod]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">توزيع الدفعة</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDistribute}
                >
                  توزيع تلقائي
                </Button>
              </div>
              {relevant.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm">
                    {s.groupTitle}{" "}
                    <span className="text-muted-foreground">
                      (مستحق {formatMoney(s.outstanding, s.currencySymbol)})
                    </span>
                  </span>
                  <Input
                    type="number"
                    className="w-28"
                    value={allocations[s.id] ?? "0"}
                    onChange={(e) =>
                      setAllocations((prev) => ({
                        ...prev,
                        [s.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span>متبقي بعد التوزيع</span>
                <span
                  className={
                    remaining > 0.01
                      ? "text-destructive font-bold"
                      : "font-medium"
                  }
                >
                  {formatMoney(
                    Math.max(0, remaining),
                    subscriptions[0]?.currencySymbol ?? "",
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || loading}>
            {loading ? "جارٍ الحفظ..." : "تأكيد الدفعة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
