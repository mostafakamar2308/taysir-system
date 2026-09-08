"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  toggleStudentMembership,
  removeStudentsFromGroup,
} from "@/actions/groups";
import AddStudentsDialog from "./addStudentsDialog";
import type { GroupDetail } from "@/types/groupDetails";

interface Props {
  group: GroupDetail;
  readOnly?: boolean;
  studentHrefBase?: string;
}

export default function GroupStudentsCard({
  group,
  readOnly = false,
  studentHrefBase,
}: Props) {
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

  const subscriptionBadge = (active: boolean) => {
    return active ? (
      <Badge variant="secondary" className="bg-green-100 text-green-700">
        نشط
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
        غير نشط
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">الطلاب</CardTitle>
          {!readOnly && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              إضافة طالب
            </Button>
          )}
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
                  {readOnly && studentHrefBase ? (
                    <Link
                      href={`${studentHrefBase}/${group.id}/${s.studentId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {s.studentName}
                    </Link>
                  ) : (
                    <div className="font-medium">{s.studentName}</div>
                  )}
                  {!readOnly && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {subscriptionBadge(!!s.active)}
                      <span>
                        • متبقي{" "}
                        {s.remainingSessions == null
                          ? "غير محدد"
                          : s.remainingSessions}{" "}
                        حصة
                      </span>
                    </div>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!s.active}
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
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <AddStudentsDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          groupId={group.id}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
