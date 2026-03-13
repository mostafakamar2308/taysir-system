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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { costCenters, paymentMethodLabels } from "@/lib/finances";
import { ExpenseFormData, ExpenseRecord, TutorOption } from "@/types/finances";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense: ExpenseRecord | null;
  onSave: (expense: ExpenseFormData) => void;
  tutors: TutorOption[];
  academyId: number;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  editingExpense,
  onSave,
  tutors,
  academyId,
}: ExpenseFormDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    costCenter: "",
    amount: "",
    currency: "SAR",
    paymentMethod: "",
    paid: "false",
    reference: "",
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
        amount: String(editingExpense.amount),
        currency: editingExpense.currency,
        paymentMethod:
          editingExpense.paymentMethod !== null
            ? String(editingExpense.paymentMethod)
            : "",
        paid: String(editingExpense.paid),
        reference: editingExpense.reference || "",
        notes: editingExpense.notes || "",
        tutorId: editingExpense.tutorId ? String(editingExpense.tutorId) : "",
        salaryMonth: editingExpense.salaryMonth || "",
      });
      setIsSalary(!!editingExpense.tutorId);
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        description: "",
        costCenter: "",
        amount: "",
        currency: "SAR",
        paymentMethod: "",
        paid: "false",
        reference: "",
        notes: "",
        tutorId: "",
        salaryMonth: "",
      });
      setIsSalary(false);
    }
  }, [editingExpense, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.date || !formData.description) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod
        ? parseInt(formData.paymentMethod)
        : null,
      paid: formData.paid === "true",
      tutorId: isSalary && formData.tutorId ? parseInt(formData.tutorId) : null,
      salaryMonth: isSalary ? formData.salaryMonth : null,
      academyId,
    };

    onSave(expenseData);
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
            {editingExpense ? "تعديل مصروف" : "إضافة مصروف"}
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
            <Label>البند *</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="وصف المصروف"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>مركز التكلفة</Label>
              <Select
                value={formData.costCenter}
                onValueChange={(v) => handleChange("costCenter", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(v) => handleChange("paymentMethod", v)}
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
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="paid"
              checked={formData.paid === "true"}
              onCheckedChange={(v) =>
                handleChange("paid", v ? "true" : "false")
              }
            />
            <Label htmlFor="paid">مدفوع</Label>
          </div>

          <div className="space-y-2">
            <Label>المرجع</Label>
            <Input
              value={formData.reference}
              onChange={(e) => handleChange("reference", e.target.value)}
              placeholder="رقم الإيصال أو رابط"
            />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isSalary"
              checked={isSalary}
              onCheckedChange={(v) => setIsSalary(!!v)}
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
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>
            {editingExpense ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
