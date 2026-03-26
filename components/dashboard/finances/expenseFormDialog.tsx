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
import { createExpense, updateExpense } from "@/actions/expense";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { paymentMethodLabels } from "@/lib/finances";
import dayjs from "@/lib/dayjs";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense: {
    id: number;
    date: string;
    description: string;
    costCenter: string | null;
    amount: number;
    currencyId: number;
    method: PaymentMethod | null;
    status: PaymentStatus;
    invoiceUrl: string | null;
    notes: string | null;
    tutorId: number | null;
    salaryMonth: string | null;
  } | null;
  tutors: { id: number; name: string }[];
  currencies: { id: number; code: string; name: string; symbol: string }[];
  academyId: number;
}

export default function ExpenseFormDialog({
  open,
  onOpenChange,
  editingExpense,
  tutors,
  currencies,
  academyId,
}: ExpenseFormDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    description: "",
    costCenter: "",
    amount: "",
    currencyId: currencies[0]?.id.toString() || "",
    method: "",
    paid: false,
    invoiceUrl: "",
    notes: "",
    tutorId: "",
    salaryMonth: "",
  });
  const [isSalary, setIsSalary] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        date: editingExpense.date,
        description: editingExpense.description,
        costCenter: editingExpense.costCenter || "",
        amount: editingExpense.amount.toString(),
        currencyId: editingExpense.currencyId.toString(),
        method: editingExpense.method?.toString() || "",
        paid: editingExpense.status === 1, // assuming 1 = PAID
        invoiceUrl: editingExpense.invoiceUrl || "",
        notes: editingExpense.notes || "",
        tutorId: editingExpense.tutorId?.toString() || "",
        salaryMonth: editingExpense.salaryMonth || "",
      });
      setIsSalary(!!editingExpense.tutorId);
    } else {
      setFormData({
        date: dayjs().format("YYYY-MM-DD"),
        description: "",
        costCenter: "",
        amount: "",
        currencyId: currencies[0]?.id.toString() || "",
        method: "",
        paid: false,
        invoiceUrl: "",
        notes: "",
        tutorId: "",
        salaryMonth: "",
      });
      setIsSalary(false);
    }
  }, [editingExpense, open, currencies]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.currencyId) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("date", formData.date);
      form.append("description", formData.description);
      if (formData.costCenter) form.append("costCenter", formData.costCenter);
      form.append("amount", formData.amount);
      form.append("currencyId", formData.currencyId);
      if (formData.method) form.append("method", formData.method);
      form.append(
        "status",
        (formData.paid ? PaymentStatus.PAID : PaymentStatus.PENDING).toString(),
      );
      if (formData.invoiceUrl) form.append("invoiceUrl", formData.invoiceUrl);
      if (formData.notes) form.append("notes", formData.notes);
      if (isSalary && formData.tutorId)
        form.append("tutorId", formData.tutorId);
      if (isSalary && formData.salaryMonth)
        form.append("salaryMonth", formData.salaryMonth);
      form.append("academyId", academyId.toString());

      if (editingExpense) {
        await updateExpense(editingExpense.id, form);
        toast({ title: "تم تحديث المصروف" });
      } else {
        await createExpense(form);
        toast({ title: "تم إضافة المصروف" });
      }
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
          <DialogTitle>
            {editingExpense ? "تعديل مصروف" : "إضافة مصروف جديد"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>مركز التكلفة</Label>
              <Input
                value={formData.costCenter}
                onChange={(e) => handleChange("costCenter", e.target.value)}
                placeholder="مثال: رواتب, إيجار, تسويق"
              />
            </div>
            <div className="space-y-2">
              <Label>العملة *</Label>
              <Select
                value={formData.currencyId}
                onValueChange={(v) => handleChange("currencyId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>الوصف *</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={formData.method}
                onValueChange={(v) => handleChange("method", v)}
              >
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
              <Label>المرجع</Label>
              <Input
                value={formData.invoiceUrl}
                onChange={(e) => handleChange("invoiceUrl", e.target.value)}
                placeholder="رقم الإيصال أو رابط"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="paid"
              checked={formData.paid}
              onCheckedChange={(v) =>
                handleChange("paid", v ? "true" : "false")
              }
            />
            <Label htmlFor="paid">مدفوع</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isSalary"
              checked={isSalary}
              onCheckedChange={(v) => setIsSalary(v === true)}
            />
            <Label htmlFor="isSalary">ربط بمعلم (راتب)</Label>
          </div>

          {isSalary && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المعلم</Label>
                <Select
                  value={formData.tutorId}
                  onValueChange={(v) => handleChange("tutorId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>شهر الراتب</Label>
                <Input
                  type="month"
                  value={formData.salaryMonth}
                  onChange={(e) => handleChange("salaryMonth", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
              placeholder="ملاحظات إضافية"
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
            <Button type="submit" disabled={loading}>
              {loading
                ? "جاري الحفظ..."
                : editingExpense
                  ? "حفظ التغييرات"
                  : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
