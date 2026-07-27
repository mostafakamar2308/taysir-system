"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { GroupDetail } from "@/types/groupDetails";
import GroupInfoCard from "./groupInfoCard";
import GroupStudentsCard from "./groupStudentsCard";
import GroupPerformanceCard from "./groupPerformanceCard";
import GroupSessionsTable from "./groupSessionsTable";

interface Props {
  group: GroupDetail;
}

export default function GroupDetailClient({ group }: Props) {
  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ar/dashboard/groups">
            <ArrowRight className="h-4 w-4 ml-1" />
            العودة للمجموعات
          </Link>
        </Button>
      </div>

      <GroupInfoCard group={group} />
      <GroupStudentsCard group={group} />

      <GroupPerformanceCard performances={group.performances} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الحصص</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupSessionsTable sessions={group.sessions} />
        </CardContent>
      </Card>
    </div>
  );
}
