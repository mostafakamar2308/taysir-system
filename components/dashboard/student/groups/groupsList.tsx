"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Users,
  User,
  Star,
  FileText,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/dates";
import type { StudentGroupSummary } from "@/types/student/groups";

interface Props {
  groups: StudentGroupSummary[];
  groupsBasePath: string;
}

export default function StudentGroupsList({ groups, groupsBasePath }: Props) {
  const publicGroups = useMemo(
    () => groups.filter((g) => !g.isPrivate),
    [groups],
  );
  const privateGroups = useMemo(
    () => groups.filter((g) => g.isPrivate),
    [groups],
  );

  if (groups.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>لا توجد مجموعات مسجلة لك بعد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold">المجموعات</h1>

      <Tabs defaultValue="public">
        <TabsList dir="rtl" className="w-full">
          <TabsTrigger value="public" className="flex-1">
            المجموعات ({publicGroups.length})
          </TabsTrigger>
          <TabsTrigger value="private" className="flex-1">
            المجموعات الخاصة ({privateGroups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="space-y-4">
          {publicGroups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  groupsBasePath={groupsBasePath}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="private" className="space-y-4">
          {privateGroups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {privateGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  groupsBasePath={groupsBasePath}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground text-center py-8">
      لا توجد مجموعات في هذا القسم
    </p>
  );
}

function GroupCard({
  group,
  groupsBasePath,
}: {
  group: StudentGroupSummary;
  groupsBasePath: string;
}) {
  return (
    <Link href={`${groupsBasePath}/${group.id}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {group.isPrivate ? (
                <User className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Users className="h-4 w-4 text-primary shrink-0" />
              )}
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {group.title}
              </h3>
            </div>
            <Badge variant="outline" className="shrink-0">
              {group.isPrivate ? "خاصة" : "مجموعة"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            المعلم: <span className="font-medium">{group.tutorName}</span>
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {group.averageRating != null && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                متوسط تقييمك:{" "}
                <span className="font-semibold">
                  {group.averageRating.toFixed(1)}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              {group.reportCount} تقرير
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            {group.nextSessionDate ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                الحصة القادمة: {formatDate(group.nextSessionDate)}
              </span>
            ) : group.latestSessionDate ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                آخر حصة: {formatDate(group.latestSessionDate)}
              </span>
            ) : (
              <span className="text-muted-foreground">لا توجد حصص مسجلة</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}