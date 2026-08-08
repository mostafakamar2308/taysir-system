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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { recordTutorPayment } from "@/actions/tutorFinances";
import { PaymentMethod } from "@/types/payment";
import { paymentMethodLabels } from "@/lib/enums";
import dayjs from "@/lib/dayjs";
import type { TutorPeriodBreakdownRow } from "@/types/tutorFinances";

interface Props {
  tutorId: number;
  tutorName: string;
  currencySymbol: string;
  periods: TutorPeriodBreakdownRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function monthLabel(month: string): string {
  return dayjs.utc(`${month}-01`).format("MMMM YYYY");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function PayTutorDialog({
  tutorId,
  tutorName,
  currencySymbol,
  periods,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [method, setMethod] = useState<string>(String(PaymentMethod.CASH));
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<{ month: string; amount: string }[]>(() =>
    periods
      .filter((p) => p.outstanding > 0)
      .map((p) => ({ month: p.month, amount: String(p.outstanding) })),
  );

  const total = round2(
    rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
  );

  const setRowAmount = (index: number, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, amount: value } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allocations = rows
      .map((r) => ({ month: r.month, amount: parseFloat(r.amount) || 0 }))
      .filter((a) => a.amount > 0);
    if (allocations.length === 0) {
      toast({ title: "اختر فترة ومبلغًا للدفعة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await recordTutorPayment(tutorId, {
        amount: total,
        method: parseInt(method),
        date,
        notes: notes || null,
        allocations,
      });
      toast({ title: "تم تسجيل الدفعة" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        title: "حدث خطأ أثناء تسجيل الدفعة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة للمعلم {tutorName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ الدفعة</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    PaymentMethod.CASH,
                    PaymentMethod.CARD,
                    PaymentMethod.BANK_TRANSFER,
                    PaymentMethod.ONLINE,
                  ].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {paymentMethodLabels[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>توزيع المبلغ على الفترات المستحقة</Label>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد فترات مستحقة حاليًا
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={row.month} className="flex items-center gap-3">
                    <div className="flex-1 text-sm font-medium">
                      {monthLabel(row.month)}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => setRowAmount(i, e.target.value)}
                      className="w-36"
                    />
                    <span className="text-xs text-muted-foreground w-10">
                      {currencySymbol}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
            <span className="text-sm">إجمالي الدفعة</span>
            <span className="font-bold">
              {total.toLocaleString("ar-EG", { maximumFractionDigits: 2 })}{" "}
              {currencySymbol}
            </span>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="مثال: دفعة شهر يوليو نقدًا"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || total <= 0}>
              {loading ? "جاري الحفظ..." : "تسجيل الدفعة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
