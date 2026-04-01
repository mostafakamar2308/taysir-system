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
import { useToast } from "@/hooks/use-toast";
import { createPayment, updatePayment } from "@/actions/payment";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/finances";
import dayjs from "@/lib/dayjs";

interface RevenueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPayment: {
    id: number;
    amount: number;
    currencyId: number;
    status: number;
    method: PaymentMethod | null;
    date: string;
    dueDate: string | null;
    description: string | null;
    studentId: number;
    planId: number | null;
    invoiceUrl: string | null;
    channel: string | null;
    notes: string | null;
  } | null;
  students: { id: number; name: string | null }[];
  plans: { id: number; title: string }[];
  currencies: { id: number; code: string; name: string; symbol: string }[];
  academyId: number;
}

export default function RevenueFormDialog({
  open,
  onOpenChange,
  editingPayment,
  students,
  plans,
  currencies,
  academyId,
}: RevenueFormDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    planId: "",
    amount: "",
    currencyId: "",
    status: "",
    method: "",
    date: dayjs().format("YYYY-MM-DD"),
    dueDate: "",
    description: "",
    channel: "",
    notes: "",
    invoiceUrl: "",
  });

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        studentId: editingPayment.studentId.toString(),
        planId: editingPayment.planId?.toString() || "",
        amount: editingPayment.amount.toString(),
        currencyId: editingPayment.currencyId.toString(),
        status: editingPayment.status.toString(),
        method: editingPayment.method?.toString() || "",
        date: editingPayment.date,
        dueDate: editingPayment.dueDate || "",
        description: editingPayment.description || "",
        channel: editingPayment.channel || "",
        notes: editingPayment.notes || "",
        invoiceUrl: editingPayment.invoiceUrl || "",
      });
    } else {
      setFormData({
        studentId: "",
        planId: "",
        amount: "",
        currencyId: currencies[0]?.id.toString() || "",
        status: PaymentStatus.PENDING.toString(),
        method: "",
        date: dayjs().format("YYYY-MM-DD"),
        dueDate: "",
        description: "",
        channel: "",
        notes: "",
        invoiceUrl: "",
      });
    }
  }, [editingPayment, open, currencies]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.amount || !formData.currencyId) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("amount", formData.amount);
      form.append("currencyId", formData.currencyId);
      form.append("status", formData.status);
      if (formData.method) form.append("method", formData.method);
      form.append("date", formData.date);
      if (formData.dueDate) form.append("dueDate", formData.dueDate);
      if (formData.description)
        form.append("description", formData.description);
      form.append("studentId", formData.studentId);
      if (formData.planId) form.append("planId", formData.planId);
      if (formData.invoiceUrl) form.append("invoiceUrl", formData.invoiceUrl);
      if (formData.channel) form.append("channel", formData.channel);
      if (formData.notes) form.append("notes", formData.notes);
      console.log(formData.currencyId);

      if (formData.currencyId) form.append("currencyId", formData.currencyId);
      form.append("academyId", academyId.toString());

      if (editingPayment) {
        await updatePayment(editingPayment.id, form);
        toast({ title: "تم تحديث الإيراد" });
      } else {
        await createPayment(form);
        toast({ title: "تم إضافة الإيراد" });
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
      <DialogContent
        dir="rtl"
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {editingPayment ? "تعديل إيراد" : "إضافة إيراد جديد"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الطالب *</Label>
              <Select
                value={formData.studentId}
                onValueChange={(v) => handleChange("studentId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الخطة (اختياري)</Label>
              <Select
                value={formData.planId}
                onValueChange={(v) => handleChange("planId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخطة" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

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
              <Label>تاريخ الاستحقاق</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="وصف الدفعة"
            />
          </div>

          <div className="space-y-2">
            <Label>رابط الفاتورة</Label>
            <Input
              type="url"
              value={formData.invoiceUrl}
              onChange={(e) => handleChange("invoiceUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
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
                : editingPayment
                  ? "حفظ التغييرات"
                  : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
