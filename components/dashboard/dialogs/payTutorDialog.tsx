"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createExpense } from "@/actions/expense";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { paymentMethodLabels } from "@/lib/enums";
import { Plus } from "lucide-react";

interface AddExpenseDialogProps {
  tutorId: number;
  tutorName: string;
  currencyId?: number;
  currencies?: { id: number; name: string }[];
  academyId: number;
  costCenters: { id: number; name: string }[];
}

export default function AddExpenseDialog({
  tutorId,
  tutorName,
  currencyId: optionalCurrencyId,
  currencies,
  academyId,
  costCenters,
}: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    currencyId: optionalCurrencyId,
    costCenterId: String(
      costCenters?.find((c) => c.name === "مرتبات المعلمين")?.id || 1,
    ),
    paymentMethod: "",
    paid: false,
    invoiceUrl: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.currencyId) {
      toast({ title: "يرجى إدخال المبلغ والعملة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("date", formData.date);
      form.append(
        "description",
        `راتب ${tutorName} - ${formData.description || "شهر"}`,
      );
      form.append("costCenterId", formData.costCenterId);
      form.append("amount", formData.amount);
      form.append("currencyId", formData.currencyId.toString());
      if (formData.paymentMethod)
        form.append("paymentMethod", formData.paymentMethod);
      form.append(
        "status",
        String(formData.paid ? PaymentStatus.PAID : PaymentStatus.PENDING),
      );
      if (formData.invoiceUrl) form.append("invoiceUrl", formData.invoiceUrl);
      if (formData.notes) form.append("notes", formData.notes);
      form.append("tutorId", String(tutorId));
      form.append(
        "salaryMonth",
        new Date(formData.date).toISOString().slice(0, 7),
      );
      form.append("academyId", String(academyId));

      await createExpense(form);
      toast({ title: "تم تسجيل المصروف" });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.log(error);

      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> تسجيل مصروف
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة للمعلم</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>التاريخ</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
            {currencies ? (
              <div className="space-y-2">
                <Label>العملة</Label>
                <Select
                  value={formData.currencyId?.toString()}
                  onValueChange={(v) =>
                    setFormData({ ...formData, currencyId: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>الوصف (اختياري)</Label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="راتب شهر مارس"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(v) =>
                  setFormData({ ...formData, paymentMethod: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
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
            <div className="space-y-2">
              <Label>رابط الايصال</Label>
              <Input
                value={formData.invoiceUrl}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceUrl: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="paid"
              checked={formData.paid}
              onCheckedChange={(v) =>
                setFormData({ ...formData, paid: v === true })
              }
            />
            <Label htmlFor="paid">مدفوع</Label>
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "تسجيل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
