"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updatePlan } from "@/actions/plan";

interface Plan {
  id: number;
  title: string;
  sessionsPerWeek: number;
  price: number;
  billingPeriod: number;
  currency: string;
  activeStudents: number;
  totalRevenue: number;
}

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan;
  currencies: { id: number; code: string; name: string }[];
}

export default function EditPlanDialog({
  open,
  onOpenChange,
  plan,
  currencies,
}: EditPlanDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(plan.title);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(
    plan.sessionsPerWeek.toString(),
  );
  const [price, setPrice] = useState(plan.price.toString());
  const [billingPeriod, setBillingPeriod] = useState(
    plan.billingPeriod.toString(),
  );
  const [currencyId, setCurrencyId] = useState(
    currencies.find((c) => c.code === plan.currency)?.id.toString() || "",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sessionsPerWeek || !price || !billingPeriod || !currencyId) {
      toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("sessionsPerWeek", sessionsPerWeek);
      formData.append("price", price);
      formData.append("billingPeriod", billingPeriod);
      formData.append("currencyId", currencyId);
      await updatePlan(plan.id, formData);
      toast({ title: "تم تحديث الخطة" });
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
          <DialogTitle>تعديل الخطة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>عنوان الخطة</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>حصص/أسبوع</Label>
              <Input
                type="number"
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>السعر</Label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>فترة الفوترة (أيام)</Label>
              <Input
                type="number"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>العملة</Label>
              <Select value={currencyId} onValueChange={setCurrencyId}>
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
