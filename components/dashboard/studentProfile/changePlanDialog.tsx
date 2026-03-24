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
import { useToast } from "@/hooks/use-toast";
import { changePlan } from "@/actions/student";

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  plans: {
    id: number;
    title: string;
    price: number;
    sessionsPerWeek: number;
    billingPeriod: number;
  }[];
  currentPlanId?: number | null;
}

export default function ChangePlanDialog({
  open,
  onOpenChange,
  studentId,
  plans,
  currentPlanId,
}: ChangePlanDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    currentPlanId || null,
  );

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      toast({ title: "الرجاء اختيار خطة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await changePlan(studentId, selectedPlanId);
      toast({ title: "تم تغيير الخطة بنجاح" });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تغيير الخطة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-lg border cursor-pointer hover:border-primary transition-colors ${
                selectedPlanId === p.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setSelectedPlanId(p.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.sessionsPerWeek} حصص/أسبوع
                  </p>
                </div>
                <p className="font-bold text-lg">{p.price} ر.س</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "جاري الحفظ..." : "تأكيد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
