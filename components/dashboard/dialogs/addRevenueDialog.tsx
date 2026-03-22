"use client";

import { useState } from "react";
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
import { StudentOption } from "@/types/finances";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { createRevenueFromDashboard } from "@/actions/payment";

interface AddRevenueDialogProps {
  children: React.ReactNode;
  students: StudentOption[];
  academyId: number;
}

export function AddRevenueDialog({
  children,
  students,
  academyId,
}: AddRevenueDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    status: PaymentStatus.PAID,
    method: PaymentMethod.BANK_TRANSFER,
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: "",
    studentId: "",
    invoiceUrl: "",
    notes: "",
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.amount ||
      !formData.date ||
      !formData.studentId ||
      !formData.method
    ) {
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
      method: formData.method,
      status: formData.status,
      studentId: parseInt(formData.studentId),
      dueDate: formData.dueDate || null,
      recordedBy: null,
      academyId,
    };
    await createRevenueFromDashboard(paymentData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة إيراد</DialogTitle>
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
                value={formData.method.toString()}
                onValueChange={(v) => handleChange("method", parseInt(v))}
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
                value={formData.status.toString()}
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>إضافة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
