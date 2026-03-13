"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { createTopic, updateTopic } from "@/actions/program";
import { ProgramTopic } from "@/types/program";

interface TopicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic?: ProgramTopic | null;
  programId: number;
  onSave: (data: { title: string; description: string }) => void;
}

export function TopicFormDialog({
  open,
  onOpenChange,
  topic,
  programId,
  onSave,
}: TopicFormDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (topic) {
      setTitle(topic.title);
      setDescription(topic.description || "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [topic, open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الموضوع",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("programId", programId.toString());
      formData.append("title", title);
      formData.append("description", description);
      formData.append("order", topic ? topic.order.toString() : "0"); // order will be set server-side

      if (topic) {
        await updateTopic(topic.id, formData);
      } else {
        await createTopic(formData);
      }

      toast({ title: topic ? "تم التعديل" : "تمت الإضافة" });
      if (topic?.title && topic.description)
        onSave({ title: topic?.title, description: topic?.description });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.log({ error });

      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-112.5" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {topic ? "تعديل الموضوع" : "إضافة موضوع جديد"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>عنوان الموضوع *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: سورة البقرة"
            />
          </div>
          <div className="grid gap-2">
            <Label>الوصف</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للموضوع..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? "جاري الحفظ..."
              : topic
                ? "حفظ التعديلات"
                : "إضافة الموضوع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
