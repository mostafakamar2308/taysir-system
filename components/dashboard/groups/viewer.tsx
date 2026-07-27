"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { DashboardGroup } from "@/types/group";
import GroupCard from "./groupCard";
import AddGroupDialog from "./addGroupDialog";

interface Props {
  initialGroups: DashboardGroup[];
  academyId: number;
}

export default function GroupsViewer({
  initialGroups: groups,
  academyId,
}: Props) {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المجموعات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {groups.length} مجموعة
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مجموعة
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          لا توجد مجموعات بعد
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onUpdate={handleRefresh} />
          ))}
        </div>
      )}

      <AddGroupDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
