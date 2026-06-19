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
import { AdminSessionClientData } from "@/types/session";
import { formatTime } from "@/lib/dates";

interface DeleteSessionDialogProps {
  session: AdminSessionClientData | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function DeleteSessionDialog({
  session,
  onConfirm,
  onCancel,
  loading,
}: DeleteSessionDialogProps) {
  return (
    <AlertDialog
      open={!!session}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد إلغاء الحصة</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من إلغاء الحصة؟
            {session && (
              <span className="block mt-1 text-foreground">
                {session.studentName} – {formatTime(session.startTime)}
              </span>
            )}
            سيتم إرجاع الحصص المستقطعة للطلاب إن وجدت.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>تراجع</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            إلغاء الحصة
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
