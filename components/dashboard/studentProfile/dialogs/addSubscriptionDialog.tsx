"use client";

import { useEffect, useState } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import dayjs from "@/lib/dayjs";
import { getPlans } from "@/actions/plan";
import { createSubscriptionForEnrollment } from "@/actions/groups";
import { StudentFinancialGroup } from "@/types/studentFinances";

interface Props {
  groups: StudentFinancialGroup[];
  academyId: number;
  currencyId: number;
  currencySymbol: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PlanOption {
  id: number;
  title: string;
  sessionCount: number;
  price: number;
  billingPeriod: number;
}

export default function AddSubscriptionDialog({
  groups,
  academyId,
  currencyId,
  currencySymbol,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  // Mounted fresh each time it opens, so initial state reflects current props.
  const activeGroups = groups.filter((g) => g.membershipActive);

  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [groupStudentId, setGroupStudentId] = useState(
    activeGroups[0]?.groupStudentId.toString() ?? "",
  );
  const [planId, setPlanId] = useState("none");
  const [price, setPrice] = useState("");
  const [sessionCount, setSessionCount] = useState("");
  const [billingCycle, setBillingCycle] = useState("30");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPlans(academyId)
      .then((res) => {
        if (!cancelled) setPlans(res.ok ? res.data ?? [] : []);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      });
    return () => {
      cancelled = true;
    };
  }, [academyId]);

  const handlePlanChange = (value: string) => {
    setPlanId(value);
    if (value === "none") return;
    const plan = plans.find((p) => p.id.toString() === value);
    if (plan) {
      setPrice(plan.price.toString());
      setSessionCount(plan.sessionCount.toString());
      setBillingCycle(plan.billingPeriod.toString());
    }
  };

  const handleSubmit = async () => {
    if (!groupStudentId) {
      toast.error("اختر مجموعة");
      return;
    }
    setLoading(true);
    try {
      const res = await createSubscriptionForEnrollment(parseInt(groupStudentId), {
        price: parseFloat(price),
        currencyId,
        planId: planId && planId !== "none" ? parseInt(planId) : null,
        sessionCount: sessionCount ? parseInt(sessionCount) : null,
        billingCycle: parseInt(billingCycle) || 30,
        startDate,
      });
      if (!res.ok) throw new Error(res.error);
      toast.success("تم إضافة الاشتراك");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل إضافة الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة اشتراك</DialogTitle>
        </DialogHeader>

        {activeGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            لا توجد مجموعات نشطة لهذا الطالب لإضافة اشتراك عليها
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المجموعة</Label>
              <Combobox
                options={activeGroups.map((g) => ({
                  value: g.groupStudentId.toString(),
                  label: g.groupTitle,
                }))}
                value={groupStudentId}
                onValueChange={setGroupStudentId}
                placeholder="اختر المجموعة"
              />
            </div>

            <div className="space-y-2">
              <Label>الباقة (اختياري)</Label>
              <Select value={planId} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="بدون باقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون باقة</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.title} — {p.sessionCount} حصة / {p.price}{" "}
                      {currencySymbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>السعر ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>عدد الحصص</Label>
                <Input
                  type="number"
                  value={sessionCount}
                  onChange={(e) => setSessionCount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>دورة الفوترة (أيام)</Label>
                <Input
                  type="number"
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || activeGroups.length === 0}
          >
            {loading ? "جارٍ الحفظ..." : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
