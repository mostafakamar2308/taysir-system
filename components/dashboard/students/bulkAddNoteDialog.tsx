"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { bulkAddNote } from "@/actions/student";

interface BulkAddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentIds: number[];
  onSuccess?: () => void;
}

export default function BulkAddNoteDialog({
  open,
  onOpenChange,
  studentIds,
  onSuccess,
}: BulkAddNoteDialogProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({ title: "الرجاء كتابة الملاحظة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await bulkAddNote(studentIds, content);
      toast({ title: "تمت إضافة الملاحظة للطلاب المحددين" });
      setContent("");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>
            إضافة ملاحظة للطلاب المحددين ({studentIds.length})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>الملاحظة</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب الملاحظة..."
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
