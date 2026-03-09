"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  ArrowUpDown,
  UserPlus,
  MessageSquare,
  StickyNote,
} from "lucide-react";

type BulkActionsBarProps = {
  selectedCount: number;
  onClearSelection: () => void;
};

export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
}: BulkActionsBarProps) {
  return (
    <Card className="border-primary/30 bg-primary/5 shadow-sm animate-in slide-in-from-top-2 duration-200">
      <CardContent className="p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          <CheckSquare className="h-4 w-4 inline ml-1.5 text-primary" />
          تم تحديد {selectedCount} طالب
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1">
            <ArrowUpDown className="h-3 w-3" />
            تغيير الحالة
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1">
            <UserPlus className="h-3 w-3" />
            تعيين معلم
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1">
            <MessageSquare className="h-3 w-3" />
            رسالة جماعية
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1">
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
  );
}
