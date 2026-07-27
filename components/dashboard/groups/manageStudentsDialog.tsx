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
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import {
  addStudentsToGroup,
  removeStudentsFromGroup,
  getAcademyStudents,
} from "@/actions/groups";
import type { DashboardGroup, StudentOption } from "@/types/group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: DashboardGroup;
  onSuccess: () => void;
}

export default function ManageStudentsDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: Props) {
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      getAcademyStudents().then(setAllStudents).catch(console.error);
      setSelectedIds(
        group.members.filter((m) => m.active).map((m) => String(m.studentId)),
      );
    }
  }, [open, group]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentActiveIds = group.members
        .filter((m) => m.active)
        .map((m) => m.studentId);
      const newSelection = selectedIds.map(Number);

      const toAdd = newSelection.filter((id) => !currentActiveIds.includes(id));
      const toRemove = currentActiveIds.filter(
        (id) => !newSelection.includes(id),
      );

      if (toAdd.length > 0) await addStudentsToGroup(group.id, toAdd);
      if (toRemove.length > 0)
        await removeStudentsFromGroup(group.id, toRemove);

      toast({ title: "تم تحديث الطلاب" });
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة / إزالة طلاب</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <MultiSelect
            options={allStudents.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
            selected={selectedIds}
            onChange={setSelectedIds}
            placeholder="اختر الطلاب"
            searchPlaceholder="ابحث..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
