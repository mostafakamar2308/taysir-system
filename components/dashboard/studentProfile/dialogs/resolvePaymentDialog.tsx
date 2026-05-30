"use client";

import { useState, useEffect } from "react";
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
import { resolvePayment } from "@/actions/student";
import { paymentMethodLabels } from "@/lib/enums";

interface ResolvePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: number;
    amount: number;
    method: number | null;
    invoiceUrl: string | null;
  } | null;
}

export default function ResolvePaymentDialog({
  open,
  onOpenChange,
  payment,
}: ResolvePaymentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(payment?.amount.toString());
  const [method, setMethod] = useState(payment?.method?.toString() ?? "");
  const [invoiceUrl, setInvoiceUrl] = useState(payment?.invoiceUrl ?? "");

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setMethod(payment.method?.toString() ?? "");
      setInvoiceUrl(payment.invoiceUrl ?? "");
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast({ title: "يرجى إدخال المبلغ", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (!payment) return;
      await resolvePayment(
        payment.id,
        method ? parseInt(method) : null,
        invoiceUrl || null,
      );
      toast({ title: "تم تسوية الدفعة" });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تسوية الدفعة المعلقة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>المبلغ</Label>
            <Input
              type="number"
              disabled
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>طريقة الدفع</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الطريقة" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>رابط الفاتورة</Label>
            <Input
              type="url"
              value={invoiceUrl}
              onChange={(e) => setInvoiceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "تسوية"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
