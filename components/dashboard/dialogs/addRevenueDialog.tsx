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
import { StudentOption } from "@/types/finances";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { createRevenueFromDashboard } from "@/actions/finances";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("AddRevenueDialog");
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
        title: t("validation.error"),
        description: t("validation.required"),
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
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("date")} *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("amount")} *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0"
              />
              <div className="text-xs font-light -mt-1 pointer-events-none">
                {t("amountHint")}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("student")} *</Label>
            <Select
              value={formData.studentId}
              onValueChange={(v) => handleChange("studentId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("studentPlaceholder")} />
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
              <Label>{t("paymentMethod")}</Label>
              <Select
                value={formData.method.toString()}
                onValueChange={(v) => handleChange("method", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("methodPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PaymentMethod)
                    .filter(([key]) => isNaN(Number(key))) // get string keys
                    .map(([key, value]) => (
                      <SelectItem key={value} value={value.toString()}>
                        {t(`method.${key}`)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("status-label")}</Label>
              <Select
                value={formData.status.toString()}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("status.pending")}</SelectItem>
                  <SelectItem value="1">{t("status.paid")}</SelectItem>
                  <SelectItem value="2">{t("status.failed")}</SelectItem>
                  <SelectItem value="3">{t("status.refunded")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("description")}</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("dueDate")}</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("invoiceUrl")}</Label>
              <Input
                value={formData.invoiceUrl}
                onChange={(e) => handleChange("invoiceUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("notes")}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit}>{t("add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
