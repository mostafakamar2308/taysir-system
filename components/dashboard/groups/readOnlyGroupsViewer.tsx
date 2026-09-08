"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import GroupCard from "./groupCard";
import type { DashboardGroup } from "@/types/group";

interface Props {
  publicGroups: DashboardGroup[];
  privateGroups: DashboardGroup[];
  detailBase: string;
}

export default function ReadOnlyGroupsViewer({
  publicGroups,
  privateGroups,
  detailBase,
}: Props) {
  const defaultTab = publicGroups.length > 0 ? "public" : "private";
  const [tab, setTab] = useState(defaultTab);

  const renderCards = (groups: DashboardGroup[], emptyText: string) =>
    groups.length === 0 ? (
      <p className="text-muted-foreground text-center py-16">{emptyText}</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onUpdate={() => {}}
            readOnly
            detailHref={`${detailBase}/${group.id}`}
          />
        ))}
      </div>
    );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">المجموعات</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {publicGroups.length + privateGroups.length} مجموعة
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="public">
            المجموعات ({publicGroups.length})
          </TabsTrigger>
          <TabsTrigger value="private">
            المجموعات الخاصة ({privateGroups.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="public" className="mt-4">
          {renderCards(publicGroups, "لا توجد مجموعات بعد")}
        </TabsContent>
        <TabsContent value="private" className="mt-4">
          {renderCards(privateGroups, "لا توجد مجموعات خاصة")}
        </TabsContent>
      </Tabs>
    </div>
  );
}