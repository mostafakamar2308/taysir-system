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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { createProgram, updateProgram } from "@/actions/program";

interface Program {
  id: number;
  name: string;
  description: string | null;
  level: string | null;
  duration: number | null;
  academyId: number;
}

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program | null;
  onSave: () => void;
  academyId: number;
}

const programLevels = ["مبتدئ", "متوسط", "متقدم", "احترافي"];

export function ProgramFormDialog({
  open,
  onOpenChange,
  program,
  onSave,
  academyId,
}: ProgramFormDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [duration, setDuration] = useState<number>(8);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (program) {
      setName(program.name);
      setDescription(program.description || "");
      setLevel(program.level || "");
      setDuration(program.duration || 8);
    } else {
      setName("");
      setDescription("");
      setLevel("");
      setDuration(8);
    }
  }, [program, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم البرنامج",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("level", level);
      formData.append("duration", duration.toString());
      formData.append("academyId", academyId.toString());

      if (program) {
        await updateProgram(program.id, formData);
      } else {
        await createProgram(formData);
      }

      toast({ title: program ? "تم التعديل" : "تمت الإضافة" });
      onSave();
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
      <DialogContent className="sm:max-w-125" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {program ? "تعديل البرنامج" : "إضافة برنامج جديد"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>اسم البرنامج *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: حفظ القرآن الكريم"
            />
          </div>
          <div className="grid gap-2">
            <Label>الوصف</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للبرنامج..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>المستوى</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستوى" />
                </SelectTrigger>
                <SelectContent>
                  {programLevels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>المدة (أسابيع)</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
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
              : program
                ? "حفظ التعديلات"
                : "إضافة البرنامج"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
