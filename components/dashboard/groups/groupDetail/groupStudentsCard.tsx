"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import {
  toggleStudentMembership,
  removeStudentsFromGroup,
} from "@/actions/groups";
import AddStudentsDialog from "./addStudentsDialog";
import type { StudentInGroup, GroupDetail } from "@/types/groupDetails";

interface Props {
  group: GroupDetail;
}

export default function GroupStudentsCard({ group }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  const handleToggleActive = async (studentId: number, active: boolean) => {
    await toggleStudentMembership(group.id, studentId, active);
    router.refresh();
  };

  const handleRemove = async (studentId: number) => {
    await removeStudentsFromGroup(group.id, [studentId]);
    router.refresh();
  };

  const subscriptionBadge = (status: StudentInGroup["subscriptionStatus"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            نشط
          </Badge>
        );
      case "near_end":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            قريب الانتهاء
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            لا يوجد
          </Badge>
        );
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">الطلاب</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            إضافة طالب
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {group.students.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا يوجد طلاب</p>
          ) : (
            group.students.map((s) => (
              <div
                key={s.studentId}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium">{s.studentName}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {subscriptionBadge(s.subscriptionStatus)}
                    <span>• متبقي {s.remainingSessions} حصة</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={s.active}
                    onCheckedChange={(checked) =>
                      handleToggleActive(s.studentId, checked)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemove(s.studentId)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AddStudentsDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        groupId={group.id}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
