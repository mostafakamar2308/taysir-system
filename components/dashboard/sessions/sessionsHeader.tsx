import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function SessionsHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إدارة الحصص</h1>
        <p className="text-sm text-muted-foreground mt-1">
          عرض وإدارة جميع الحصص في التقويم الأسبوعي
        </p>
      </div>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="h-4 w-4" />
        إضافة حصة
      </Button>
    </div>
  );
}
