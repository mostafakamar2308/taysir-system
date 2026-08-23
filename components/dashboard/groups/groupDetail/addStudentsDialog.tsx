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
import { addStudentsToGroup, getAcademyStudents } from "@/actions/groups";
import type { StudentOption } from "@/types/group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  onSuccess: () => void;
}

export default function AddStudentsDialog({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: Props) {
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      getAcademyStudents().then((res) => {
        if (res.ok) setAllStudents(res.data ?? []);
      }).catch(console.error);
      // No need to reset selectedIds – the component remounts via the key prop
    }
  }, [open]);

  const handleSave = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await addStudentsToGroup(groupId, selectedIds.map(Number));
      if (!res.ok) throw new Error(res.error);
      toast({ title: "تمت إضافة الطلاب" });
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
    <Dialog
      key={open ? "open" : "closed"} // force remount on each open
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة طلاب إلى المجموعة</DialogTitle>
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
              {loading ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
