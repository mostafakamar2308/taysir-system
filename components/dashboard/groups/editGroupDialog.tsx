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
import { updateGroup, getAcademyTutors } from "@/actions/groups";
import type { DashboardGroup, TutorOption } from "@/types/group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: DashboardGroup;
  onSuccess: () => void;
}

export default function EditGroupDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: Props) {
  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState(
    String(group.currentTutorId),
  );
  const [tutorHourlyRate, setTutorHourlyRate] = useState(
    group.tutorHourlyRate?.toString() ?? "",
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch tutors only when the dialog opens
  useEffect(() => {
    if (open) {
      getAcademyTutors().then((res) => {
        if (res.ok) setTutors(res.data ?? []);
      }).catch(console.error);
    }
  }, [open]);

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
    formData.set("tutorHourlyRate", tutorHourlyRate);
    setLoading(true);
    try {
      const res = await updateGroup(group.id, formData);
      if (!res.ok) throw new Error(res.error);
      toast({ title: "تم حفظ التغييرات" });
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
      key={open ? group.id : "closed"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل المجموعة</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label>اسم المجموعة *</Label>
            <Input name="title" defaultValue={group.title} required />
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
            <Label>سعر الساعة للمجموعة</Label>
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
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
