"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, UserPlus, StickyNote } from "lucide-react";
import BulkAssignTutorDialog from "@/components/dashboard/students/bulkAssignTutorDialog";
import BulkChangeStatusDialog from "@/components/dashboard/students/bulkChangeStatusDialog";
import BulkAddNoteDialog from "@/components/dashboard/students/bulkAddNoteDialog";

type BulkActionsBarProps = {
  selectedCount: number;
  selectedIds: number[];
  tutors: { id: number; name: string }[];
  plans: { id: number; title: string }[];
  onClearSelection: () => void;
  onSuccess?: () => void;
};

export default function BulkActionsBar({
  selectedCount,
  selectedIds,
  tutors,
  plans,
  onClearSelection,
  onSuccess,
}: BulkActionsBarProps) {
  const [assignTutorOpen, setAssignTutorOpen] = useState(false);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);

  const handleSuccess = () => {
    onClearSelection();
    onSuccess?.();
  };

  return (
    <>
      <Card className="border-primary/30 bg-primary/5 shadow-sm animate-in slide-in-from-top-2 duration-200">
        <CardContent className="p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            <CheckSquare className="h-4 w-4 inline ml-1.5 text-primary" />
            تم تحديد {selectedCount} طالب
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => setChangeStatusOpen(true)}
            >
              <CheckSquare className="h-3 w-3" />
              تغيير الحالة
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => setAssignTutorOpen(true)}
            >
              <UserPlus className="h-3 w-3" />
              تعيين معلم
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => setAddNoteOpen(true)}
            >
              <StickyNote className="h-3 w-3" />
              إضافة ملاحظة
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="text-xs"
            >
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>

      <BulkAssignTutorDialog
        open={assignTutorOpen}
        onOpenChange={setAssignTutorOpen}
        studentIds={selectedIds}
        tutors={tutors}
        onSuccess={handleSuccess}
      />

      <BulkChangeStatusDialog
        open={changeStatusOpen}
        onOpenChange={setChangeStatusOpen}
        studentIds={selectedIds}
        plans={plans}
        onSuccess={handleSuccess}
      />

      <BulkAddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        studentIds={selectedIds}
        onSuccess={handleSuccess}
      />
    </>
  );
}
