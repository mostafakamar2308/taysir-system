"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { uploadSolution } from "@/actions/homeworkSolution";
import { Upload } from "lucide-react";

interface Props {
  participantId: number;
  onSuccess?: () => void;
}

export function UploadSolutionDialog({ participantId, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadSolution(participantId, formData);
      toast({ title: "تم رفع الحل بنجاح" });
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Upload className="h-4 w-4" /> رفع الحل
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>رفع حل الواجب</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>ملف الحل (PDF أو Word، أقصى حجم 5 ميجابايت)</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={!file || loading}>
            {loading ? "جاري الرفع..." : "رفع"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
