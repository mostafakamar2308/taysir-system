"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, Calendar, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { DashboardGroup } from "@/types/group";
import { formatDate, formatTime } from "@/lib/dates";
import EditGroupDialog from "./editGroupDialog";
import ManageStudentsDialog from "./manageStudentsDialog";
import ActivateStudentsDialog from "./manageStudentsActivationDialog";

interface Props {
  group: DashboardGroup;
  onUpdate: () => void;
}

export default function GroupCard({ group, onUpdate }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);

  const effectiveRate = group.tutorHourlyRate ?? group.baseGroupHourlyRate;
  const hasOverride =
    group.tutorHourlyRate !== null &&
    group.tutorHourlyRate !== group.baseGroupHourlyRate;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6 space-y-5 flex flex-col h-full">
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={`/ar/dashboard/groups/${group.id}`}
                className="font-bold text-2xl hover:underline text-primary transition-colors"
              >
                {group.title}
              </Link>

              <div className="flex items-center gap-2 text-base text-muted-foreground mt-2">
                <Users className="h-5 w-5" />
                <span>{group.activeStudentsCount} طالب نشط</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setManageOpen(true)}>
                  إضافة / حذف طلاب
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActivateOpen(true)}>
                  تنشيط / تعطيل طلاب
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  تعديل المجموعة
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tutor & Rate */}
          <div className="grid grid-cols-2 gap-3 text-base">
            <Link
              href={`/ar/dashboard/tutors/${group.currentTutorId}`}
              className="text-primary hover:underline font-semibold"
            >
              {group.currentTutorName}
            </Link>
            <span className="text-muted-foreground">
              سعر المجموعة: {effectiveRate}
              {hasOverride && (
                <span className="text-sm">
                  {" "}
                  (تجاوز السعر الأساسي {group.baseGroupHourlyRate})
                </span>
              )}
            </span>
          </div>

          {/* Sessions */}
          <div className="grid grid-cols-2 gap-3 text-base">
            {group.nextSessionDate ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>
                  القادمة: {formatDate(group.nextSessionDate)}{" "}
                  {formatTime(group.nextSessionDate)}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">لا توجد حصة قادمة</span>
            )}
            {group.latestSessionDate ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>
                  الأخيرة: {formatDate(group.latestSessionDate)}{" "}
                  {formatTime(group.latestSessionDate)}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">لا توجد حصة سابقة</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditGroupDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        group={group}
        onSuccess={onUpdate}
      />
      <ManageStudentsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        group={group}
        onSuccess={onUpdate}
      />
      <ActivateStudentsDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        group={group}
        onSuccess={onUpdate}
      />
    </>
  );
}
