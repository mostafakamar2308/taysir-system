"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createStudentReport,
  updateStudentReport,
} from "@/actions/studentReports";
import type { StudentReportItem } from "@/types/studentReport";
import { Upload } from "lucide-react";

interface Props {
  studentId: number;
  studentName?: string;
  report?: StudentReportItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddStudentReportDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <ReportForm {...props} />}
    </Dialog>
  );
}

function ReportForm({
  studentId,
  studentName,
  report,
  onOpenChange,
  onSuccess,
}: Props) {
  const isEdit = !!report;
  const [title, setTitle] = useState(report?.title ?? "");
  const [content, setContent] = useState(report?.content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "العنوان مطلوب", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (content.trim()) formData.append("content", content.trim());
      if (file) formData.append("file", file);

      const res = isEdit
        ? await updateStudentReport(report.id, formData)
        : await createStudentReport(studentId, formData);
      if (!res.ok) throw new Error(res.error);

      toast({
        title: isEdit
          ? "تم تحديث التقرير بنجاح"
          : "تم إضافة التقرير وإخطار الطالب",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent dir="rtl">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "تعديل التقرير" : "إضافة تقرير جديد"}
          {studentName ? ` – ${studentName}` : ""}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>عنوان التقرير *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>محتوى التقرير</Label>
          <Textarea
            rows={6}
            placeholder="اكتب تفاصيل التقرير هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div>
          <Label>
            {isEdit && report?.originalFileName
              ? `الملف الحالي: ${report.originalFileName}`
              : "ملف التقرير (PDF، أقصى حجم 5 ميجابايت) - اختياري"}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Upload className="h-3.5 w-3.5" />
                {file.name}
              </span>
            )}
          </div>
          {!content && !file && !(isEdit && report?.hasFile) && (
            <p className="text-xs text-destructive mt-1">
              أضف نصاً أو ارفع ملف PDF واحداً على الأقل.
            </p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "جاري الحفظ..." : isEdit ? "حفظ" : "إضافة التقرير"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}