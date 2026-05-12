"use client";

import { useState, useEffect } from "react";
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
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/finances";
import dayjs from "@/lib/dayjs";
import { createRevenueFromDashboard, updateRevenue } from "@/actions/finances";
import { useRouter } from "next/navigation";

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
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    planId: "",
    amount: "",
    currencyId: "",
    status: PaymentStatus.PENDING.toString(),
    method: "",
    date: dayjs().format("YYYY-MM-DD"),
    dueDate: "",
    description: "",
    channel: "",
    notes: "",
    invoiceUrl: "",
  });

  // Fill form on edit
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
      // Reset
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
      const payload = {
        amount: parseFloat(formData.amount),
        currencyId: parseInt(formData.currencyId),
        status: parseInt(formData.status),
        method: formData.method
          ? (parseInt(formData.method) as PaymentMethod)
          : PaymentMethod.ONLINE,
        dueDate: formData.dueDate,
        date: formData.dueDate,
        description: formData.description || undefined,
        studentId: parseInt(formData.studentId),
        planId: formData.planId ? parseInt(formData.planId) : undefined,
        academyId,
        recordedBy: null,
        invoiceUrl: formData.invoiceUrl || undefined,
        channel: formData.channel || undefined,
        notes: formData.notes || undefined,
      };

      if (editingPayment) {
        await updateRevenue(editingPayment.id, payload);
        toast({ title: "تم تحديث الإيراد" });
      } else {
        await createRevenueFromDashboard(payload);
        toast({ title: "تم إضافة الإيراد" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ",
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
