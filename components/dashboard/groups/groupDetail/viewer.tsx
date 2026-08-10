"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import type { GroupDetail } from "@/types/groupDetails";
import GroupInfoCard from "./groupInfoCard";
import GroupStudentsCard from "./groupStudentsCard";
import GroupPerformanceCard from "./groupPerformanceCard";
import GroupSessionsTable from "./groupSessionsTable";
import AddGroupSessionDialog from "./addGroupSessionDialog";

interface Props {
  group: GroupDetail;
  tutors: { id: number; name: string | null }[];
}

export default function GroupDetailClient({ group, tutors }: Props) {
  const [addSessionOpen, setAddSessionOpen] = useState(false);

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ar/dashboard/groups">
            <ArrowRight className="h-4 w-4 ml-1" />
            العودة للمجموعات
          </Link>
        </Button>
        <Button size="sm" onClick={() => setAddSessionOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة حصة
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

      <AddGroupSessionDialog
        open={addSessionOpen}
        onOpenChange={setAddSessionOpen}
        groupId={group.id}
        defaultTutorId={group.tutorId}
        tutors={tutors}
        members={group.students.map((s) => ({
          id: s.studentId,
          name: s.studentName,
          sessionsRemaining: s.remainingSessions,
        }))}
      />
    </div>
  );
}
