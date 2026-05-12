"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteSession } from "@/actions/sessions";
import { DashboardSession } from "@/types/session";

interface Props {
  session: DashboardSession | null;
  onClose: () => void;
  onConfirm: (session: DashboardSession) => void; // used to refresh after deletion
}

export function DeleteSessionDialog({ session, onClose, onConfirm }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!session) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSession(session.id);
      toast({ title: "تم حذف الحصة" });
      onConfirm(session);
      onClose();
      router.refresh();
    } catch (error) {
      console.log(error);

      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            حذف الحصة
          </DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف حصة &quot;{session.studentName}&quot; مع &quot;
            {session.tutorName}&quot;؟
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "جاري الحذف..." : "حذف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
