"use client";

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
import { useState } from "react";

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
  onDeleted?: () => void;
}

export default function DeleteSessionDialog({
  open,
  onOpenChange,
  sessionId,
  onDeleted,
}: DeleteSessionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteSession(sessionId);
      toast({ title: "تم حذف الحصة" });
      onOpenChange(false);
      onDeleted?.();
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد حذف الحصة</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من حذف هذه الحصة؟ لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground"
          >
            {loading ? "جاري الحذف..." : "حذف"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
