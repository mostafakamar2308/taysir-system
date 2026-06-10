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
import { createExpense } from "@/actions/expense";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";

interface AddExpenseDialogProps {
  children: React.ReactNode;
  academyId: number;
  tutors: { id: number; name: string | null }[];
  currencies: { id: number; name: string }[];
  costCenters: { id: number; title: string }[];
}

export function AddExpenseDialog({
  children,
  academyId,
  tutors,
  currencies,
  costCenters,
}: AddExpenseDialogProps) {
  const t = useTranslations("AddExpenseDialog");
  const [open, setOpen] = useState(false);
  const [salary, setSalary] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    if (
      !formData.get("amount") ||
      !formData.get("date") ||
      !formData.get("currencyId") ||
      !formData.get("paymentMethod")
    ) {
      toast({
        title: t("validation.error"),
        description: t("validation.required"),
        variant: "destructive",
      });
      return;
    }
    formData.append("academyId", academyId.toString());
    if (salary) {
      formData.delete("tutorId");
      formData.delete("salaryMonth");
    }

    await createExpense(formData);
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
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("date")} *</Label>
                <Input
                  defaultValue={new Date().toISOString().split("T")[0]}
                  type="date"
                  name="date"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("amount")} *</Label>
                <Input type="number" name="amount" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{t("currency")}</Label>
                <Select
                  name="currencyId"
                  defaultValue={currencies[0].id.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("currencyPlaceholder")} />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("paymentMethod")}</Label>
                <Select name="paymentMethod">
                  <SelectTrigger>
                    <SelectValue placeholder={t("methodPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PaymentMethod)
                      .filter(([key]) => isNaN(Number(key)))
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
                <Select name="status">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentStatus.PENDING.toString()}>
                      {t("status.pending")}
                    </SelectItem>
                    <SelectItem value={PaymentStatus.PAID.toString()}>
                      {t("status.paid")}
                    </SelectItem>
                    <SelectItem value={PaymentStatus.FAILED.toString()}>
                      {t("status.failed")}
                    </SelectItem>
                    <SelectItem value={PaymentStatus.REFUNDED.toString()}>
                      {t("status.refunded")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <Label>{t("description")}</Label>
                <Input name="description" />
              </div>
              <div className="space-y-2">
                <Label>{t("costCenter")}</Label>
                <Select
                  name="costCenterId"
                  defaultValue={costCenters[0].id.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("costCenterPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-x-2 items-center flex">
              <Checkbox
                checked={salary}
                onCheckedChange={(state) =>
                  state !== "indeterminate" && setSalary(state)
                }
              />
              <Label>{t("tutorSalary")}</Label>
            </div>
            {salary ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("tutor")}</Label>
                  <Select name="tutorId">
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>{t("salaryMonth")}</Label>
                  <Input
                    name="salaryMonth"
                    placeholder={t("salaryMonthPlaceholder")}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("invoiceUrl")}</Label>
                <Input name="invoiceUrl" placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea name="notes" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button formAction={handleSubmit}>{t("add")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
