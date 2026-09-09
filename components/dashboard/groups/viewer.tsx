"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.title.toLowerCase().includes(q));
  }, [groups, search]);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">المجموعات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {groups.length} مجموعة
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المجموعة..."
              className="pl-4 pr-9"
            />
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مجموعة
          </Button>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          {groups.length === 0 ? "لا توجد مجموعات بعد" : "لا توجد نتائج مطابقة"}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map((group) => (
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
