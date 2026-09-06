"use client";

import { useState } from "react";
import { updateRevenue, RevenueHistoryItem } from "@/actions/finances";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/enums";

export default function EditRevenueDialog({
  open,
  onOpenChange,
  revenue,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue: RevenueHistoryItem;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(revenue.amount.toString());
  const [status, setStatus] = useState(revenue.status.toString());
  const [method, setMethod] = useState((revenue.method ?? 0).toString());
  const [dueDate, setDueDate] = useState(revenue.dueDate);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateRevenue(revenue.id, {
        amount: parseFloat(amount),
        status: parseInt(status),
        method: parseInt(method),
        dueDate,
      });
      toast.success("تم تحديث الإيراد بنجاح");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("فشل في تحديث الإيراد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل الإيراد</DialogTitle>
          <DialogDescription>
            الطالب: {revenue.studentName}{" "}
            {revenue.planName ? "- " + revenue.planName : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>المبلغ</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>الحالة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentStatusLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>طريقة الدفع</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>تاريخ الاستحقاق</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
