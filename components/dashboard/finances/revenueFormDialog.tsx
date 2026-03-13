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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { paymentMethodLabels } from "@/lib/finances";
import {
  PaymentFormData,
  PaymentRecord,
  PlanOption,
  StudentOption,
} from "@/types/finances";

interface RevenueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPayment: PaymentRecord | null;
  onSave: (payment: FormData) => void;
  students: StudentOption[];
  plans: PlanOption[];
  academyId: number;
}

export function RevenueFormDialog({
  open,
  onOpenChange,
  editingPayment,
  onSave,
  students,
  plans,
  academyId,
}: RevenueFormDialogProps) {
  const [formData, setFormData] = useState({
    amount: "",
    currency: "EGP",
    status: "0",
    method: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: "",
    studentId: "",
    planId: "",
    invoiceUrl: "",
    channel: "",
    notes: "",
  });

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        amount: String(editingPayment.amount),
        currency: editingPayment.currency,
        status: String(editingPayment.status),
        method:
          editingPayment.method !== null ? String(editingPayment.method) : "",
        date: editingPayment.date,
        dueDate: editingPayment.dueDate || "",
        description: editingPayment.description || "",
        studentId: String(editingPayment.studentId),
        planId: editingPayment.planId ? String(editingPayment.planId) : "",
        invoiceUrl: editingPayment.invoiceUrl || "",
        channel: editingPayment.channel || "",
        notes: editingPayment.notes || "",
      });
    } else {
      setFormData({
        amount: "",
        currency: "SAR",
        status: "0",
        method: "",
        date: new Date().toISOString().split("T")[0],
        dueDate: "",
        description: "",
        studentId: "",
        planId: "",
        invoiceUrl: "",
        channel: "",
        notes: "",
      });
    }
  }, [editingPayment, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.date || !formData.studentId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      ...formData,
      amount: parseFloat(formData.amount),
      method: formData.method ? parseInt(formData.method) : null,
      status: parseInt(formData.status),
      studentId: parseInt(formData.studentId),
      planId: formData.planId ? parseInt(formData.planId) : null,
      dueDate: formData.dueDate || null,
      recordedBy: null,
      academyId,
    };

    onSave(paymentData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>
            {editingPayment ? "تعديل إيراد" : "إضافة إيراد"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

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
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={formData.method}
                onValueChange={(v) => handleChange("method", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">معلق</SelectItem>
                  <SelectItem value="1">مدفوع</SelectItem>
                  <SelectItem value="2">فشل</SelectItem>
                  <SelectItem value="3">مسترد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الخطة</Label>
              <Select
                value={formData.planId}
                onValueChange={(v) => handleChange("planId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون خطة</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>القناة</Label>
              <Input
                value={formData.channel}
                onChange={(e) => handleChange("channel", e.target.value)}
                placeholder="مثال: متجر"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ الاستحقاق</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>رابط الفاتورة</Label>
              <Input
                value={formData.invoiceUrl}
                onChange={(e) => handleChange("invoiceUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>
            {editingPayment ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
