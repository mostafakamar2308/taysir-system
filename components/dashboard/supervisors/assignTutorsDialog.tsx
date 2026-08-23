"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { assignTutors } from "@/actions/supervisor";

export interface AssignableTutor {
  id: number;
  name: string;
  email: string;
  active: boolean;
  supervisorId: number | null;
}

interface AssignTutorsDialogProps {
  supervisorId: number;
  supervisorName: string;
  tutors: AssignableTutor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssignTutorsDialog({
  supervisorId,
  supervisorName,
  tutors,
  open,
  onOpenChange,
}: AssignTutorsDialogProps) {
  const [assignedIds, setAssignedIds] = useState<Set<number>>(
    () =>
      new Set(
        tutors.filter((t) => t.supervisorId === supervisorId).map((t) => t.id),
      ),
  );
  const [savingId, setSavingId] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleToggle(tutorId: number, checked: boolean) {
    setSavingId(tutorId);
    const next = new Set(assignedIds);
    if (checked) next.add(tutorId);
    else next.delete(tutorId);
    setAssignedIds(next);
    try {
      const res = await assignTutors(supervisorId, Array.from(next));
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (error) {
      console.error(error);
      setAssignedIds(assignedIds);
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  }

  function handleSelectAll() {
    const all = new Set(tutors.map((t) => t.id));
    setAssignedIds(all);
    assignTutors(supervisorId, Array.from(all))
      .then(() => router.refresh())
      .catch((error) => {
        console.error(error);
        setAssignedIds(
          new Set(
            tutors.filter((t) => t.supervisorId === supervisorId).map((t) => t.id),
          ),
        );
        toast({ title: "حدث خطأ", variant: "destructive" });
      });
  }

  function handleClearAll() {
    setAssignedIds(new Set());
    assignTutors(supervisorId, [])
      .then(() => router.refresh())
      .catch((error) => {
        console.error(error);
        setAssignedIds(
          new Set(
            tutors.filter((t) => t.supervisorId === supervisorId).map((t) => t.id),
          ),
        );
        toast({ title: "حدث خطأ", variant: "destructive" });
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تعيين معلمين للمشرف</DialogTitle>
          <p className="text-sm text-muted-foreground">{supervisorName}</p>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {assignedIds.size} معلم معيّن
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              تحديد الكل
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              إلغاء الكل
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[50vh]">
          <div className="space-y-2">
            {tutors.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                لا يوجد معلمين في الأكاديمية
              </p>
            )}
            {tutors.map((tutor) => (
              <div
                key={tutor.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Switch
                    checked={assignedIds.has(tutor.id)}
                    disabled={savingId === tutor.id}
                    onCheckedChange={(checked) =>
                      handleToggle(tutor.id, checked)
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tutor.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tutor.email}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    assignedIds.has(tutor.id)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  }
                >
                  {assignedIds.has(tutor.id) ? "معيّن" : "غير معيّن"}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
