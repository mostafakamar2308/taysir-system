"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { reverseTutorPayment } from "@/actions/tutorFinances";

interface Props {
  expenseId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ReversePaymentDialog({
  expenseId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await reverseTutorPayment(expenseId);
      toast({ title: "تم استرجاع الدفعة" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ title: "حدث خطأ أثناء استرجاع الدفعة", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>استرجاع الدفعة</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          سيتم تحويل الدفعة إلى حالة «مسترد» ولن تُحتسب ضمن المدفوعات. لن يتم
          حذف السجل نهائيًا.
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "جاري الاسترجاع..." : "تأكيد الاسترجاع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
