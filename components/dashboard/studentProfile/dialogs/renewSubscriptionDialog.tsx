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
import { renewSubscription } from "@/actions/student"; // adjust path if needed

interface RenewSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  studentName: string;
  planTitle?: string;
  sessionsPerWeek: number;
}

export default function RenewSubscriptionDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  sessionsPerWeek,
  planTitle,
}: RenewSubscriptionDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"paid" | "pending" | null>(null);

  const handleRenew = async (paid: boolean) => {
    setLoading(paid ? "paid" : "pending");
    try {
      await renewSubscription(studentId, paid);
      toast({ title: "تم تجديد الاشتراك بنجاح" });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "حدث خطأ",
          description: error.message || "فشل تجديد الاشتراك",
          variant: "destructive",
        });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>تجديد الاشتراك</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center space-y-2">
          <p className="text-base font-medium">
            هل تريد تجديد اشتراك الطالب{" "}
            <span className="font-bold">{studentName}</span>، في الخطة{" "}
            <span className="font-bold">{planTitle}</span>؟
          </p>
          <p className="text-sm text-muted-foreground">
            سيتم إضافة {sessionsPerWeek * 4} حصص لرصيد الطالب
          </p>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row-reverse gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={!!loading}
          >
            إلغاء
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleRenew(false)}
            disabled={!!loading}
          >
            {loading === "pending" ? "جاري..." : "جدد الاشتراك والدفع مؤخرا"}
          </Button>
          <Button
            variant="default"
            onClick={() => handleRenew(true)}
            disabled={!!loading}
          >
            {loading === "paid" ? "جاري..." : "جدد الاشتراك مع الدفع مقدما"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
