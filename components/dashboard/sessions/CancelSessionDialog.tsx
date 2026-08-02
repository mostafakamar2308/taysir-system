"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSession } from "@/actions/sessions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
}

export function CancelSessionDialog({ open, onOpenChange, sessionId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteSession(sessionId);
      toast({ title: "تم إلغاء الحصة" });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error)
        toast({
          title: "خطأ",
          description: err.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد إلغاء الحصة</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من إلغاء هذه الحصة؟ سيتم إرجاع أرصدة الطلاب إن كانت
            مخصومة.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>تراجع</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "جاري الإلغاء..." : "إلغاء الحصة"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
