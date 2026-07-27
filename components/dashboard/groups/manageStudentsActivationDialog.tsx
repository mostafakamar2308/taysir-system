"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { toggleStudentMembership } from "@/actions/groups";
import type { DashboardGroup } from "@/types/group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: DashboardGroup;
  onSuccess: () => void;
}

export default function ActivateStudentsDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: Props) {
  const [activations, setActivations] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialise switches from current members
  useState(() => {
    const init: Record<number, boolean> = {};
    group.members.forEach((m) => (init[m.studentId] = m.active));
    setActivations(init);
  });

  const handleToggle = async (studentId: number, active: boolean) => {
    setLoading(true);
    try {
      await toggleStudentMembership(group.id, studentId, active);
      // Optimistically update local state
      setActivations((prev) => ({ ...prev, [studentId]: active }));
      onSuccess(); // will refresh the page data
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
          <DialogTitle>تنشيط / تعطيل الطلاب</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {group.members.map((m) => (
            <div
              key={m.studentId}
              className="flex items-center justify-between"
            >
              <Label>{m.studentName}</Label>
              <Switch
                checked={activations[m.studentId] ?? m.active}
                onCheckedChange={(checked) =>
                  handleToggle(m.studentId, checked)
                }
                disabled={loading}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
