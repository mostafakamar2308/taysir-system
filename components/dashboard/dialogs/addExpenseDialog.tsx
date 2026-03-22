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
import { createExpense } from "@/actions/expense";
import { PaymentStatus } from "@/types/payment";
import { Checkbox } from "@/components/ui/checkbox";

interface AddExpenseDialogProps {
  children: React.ReactNode;
  academyId: number;
  tutors: { id: number; name: string | null }[];
  currencies: { id: number; name: string }[];
}

export function AddExpenseDialog({
  children,
  academyId,
  tutors,
  currencies,
}: AddExpenseDialogProps) {
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
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
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
          <DialogTitle>تسجيل مصروف</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التاريخ *</Label>
                <Input
                  defaultValue={new Date().toISOString().split("T")[0]}
                  type="date"
                  name="date"
                />
              </div>
              <div className="space-y-2">
                <Label>المبلغ *</Label>
                <Input type="number" name="amount" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>العملة</Label>
                <Select
                  name="currencyId"
                  defaultValue={currencies[0].id.toString()}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select name="paymentMethod">
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
                <Select name="status">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentStatus.PENDING.toString()}>
                      معلق
                    </SelectItem>
                    <SelectItem value={PaymentStatus.PAID.toString()}>
                      مدفوع
                    </SelectItem>
                    <SelectItem value={PaymentStatus.FAILED.toString()}>
                      فشل
                    </SelectItem>
                    <SelectItem value={PaymentStatus.REFUNDED.toString()}>
                      مسترد
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input name="description" />
            </div>

            <div className="space-x-2 items-center flex">
              <Checkbox
                checked={salary}
                onCheckedChange={(state) =>
                  state !== "indeterminate" && setSalary(state)
                }
              />
              <Label>راتب معلم</Label>
            </div>
            {salary ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المعلم</Label>
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
                  </Select>{" "}
                </div>
                <div className="space-y-2">
                  <Label>الشهر</Label>
                  <Input name="salaryMonth" placeholder="شهر 4" />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رابط الفاتورة</Label>
                <Input name="invoiceUrl" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>مركز المصروفات</Label>
                <Input name="costCenter" placeholder="المرتبات" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea name="notes" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button formAction={handleSubmit}>إضافة</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
