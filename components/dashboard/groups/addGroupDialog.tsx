"use client";

import { useState, useEffect } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { createGroup, getAcademyTutors, getAcademyStudents } from "@/actions/groups";
import { MultiSelect } from "@/components/ui/multi-select";
import type { StudentOption, TutorOption } from "@/types/group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddGroupDialog({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [tutorHourlyRate, setTutorHourlyRate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch tutors + students only when the dialog opens – no state resets needed
  useEffect(() => {
    if (open) {
      getAcademyTutors().then((res) => {
        if (res.ok) setTutors(res.data ?? []);
      }).catch(console.error);
      getAcademyStudents().then((res) => {
        if (res.ok) setStudents(res.data ?? []);
      }).catch(console.error);
    }
  }, [open]);

  // Handle tutor selection – pre-fill rate if field is empty
  const handleTutorChange = (value: string) => {
    setSelectedTutorId(value);
    if (!tutorHourlyRate) {
      const tutor = tutors.find((t) => t.id === parseInt(value));
      if (tutor) {
        setTutorHourlyRate(tutor.baseGroupHourlyRate?.toString() ?? "");
      }
    }
  };

  async function handleSubmit(formData: FormData) {
    if (selectedStudentIds.length < 2) {
      toast({
        title: "خطأ",
        description: "يجب اختيار طالبين على الأقل لإنشاء مجموعة",
        variant: "destructive",
      });
      return;
    }
    for (const id of selectedStudentIds) formData.append("studentIds", id);
    formData.set("tutorHourlyRate", tutorHourlyRate);
    setLoading(true);
    try {
      const res = await createGroup(formData);
      if (!res.ok) throw new Error(res.error);
      toast({ title: "تم إنشاء المجموعة" });
      onOpenChange(false);
      onSuccess();
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
  }

  return (
    <Dialog
      key={open ? "open" : "closed"} // force remount on each open
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>مجموعة جديدة</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label>اسم المجموعة *</Label>
            <Input name="title" required placeholder="مثال: حلقة التجويد" />
          </div>
          <div>
            <Label>المعلم *</Label>
            <Combobox
              name="tutorId"
              options={tutors.map((t) => ({
                value: String(t.id),
                label: t.name,
              }))}
              value={selectedTutorId}
              onValueChange={handleTutorChange}
              placeholder="اختر المعلم"
            />
          </div>
          <div>
            <Label>سعر الساعة للمعلم بالجنيه</Label>
            <Input
              name="tutorHourlyRate"
              type="number"
              step="0.01"
              value={tutorHourlyRate}
              onChange={(e) => setTutorHourlyRate(e.target.value)}
              placeholder="اتركه فارغاً لاستخدام السعر الأساسي"
            />
            {selectedTutorId && (
              <p className="text-xs text-muted-foreground mt-1">
                السعر الأساسي للمعلم:{" "}
                {tutors.find((t) => t.id === parseInt(selectedTutorId))
                  ?.baseGroupHourlyRate ?? "—"}
              </p>
            )}
          </div>
          <div>
            <Label>الطلاب *</Label>
            <MultiSelect
              options={students.map((s) => ({
                value: String(s.id),
                label: s.name,
              }))}
              selected={selectedStudentIds}
              onChange={setSelectedStudentIds}
              placeholder="اختر طالبين على الأقل"
              searchPlaceholder="بحث عن طالب..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              اختر طالبين على الأقل حتى تظهر المجموعة في الصفحة
              {selectedStudentIds.length > 0 &&
                ` (المختار: ${selectedStudentIds.length})`}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
