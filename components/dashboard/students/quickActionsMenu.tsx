"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DashboardStudent } from "@/types/student";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Phone,
  Mail,
  RefreshCw,
  StickyNote,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import EditStudentDialog from "@/components/dashboard/students/editStudentDialog";
import ChangeStatusDialog from "@/components/dashboard/students/changeStatusDialog";
import AssignTutorDialog from "@/components/dashboard/students/assignTutorDialog";
import AddNoteDialog from "@/components/dashboard/students/addNoteDialog";

export function QuickActionsMenu({
  student,
  currencies,
  plans,
  tutors,
}: {
  student: DashboardStudent;
  tutors: { id: number; name: string }[];
  plans: { id: number; title: string }[];
  currencies: { id: number; name: string }[];
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [assignTutorOpen, setAssignTutorOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <Link
            className="flex gap-2 items-center"
            href={`/ar/dashboard/students/${student.id}`}
          >
            <DropdownMenuItem className="gap-2 text-sm w-full">
              <Eye className="h-3.5 w-3.5" /> عرض الملف
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="gap-2 text-sm"
            onClick={() => setEditDialogOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" /> تعديل
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-sm"
            onClick={() => setChangeStatusOpen(true)}
          >
            <RefreshCw className="h-3.5 w-3.5" /> تغيير الحالة
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-sm"
            onClick={() => setAssignTutorOpen(true)}
          >
            <UserCog className="h-3.5 w-3.5" /> تعيين معلم
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-sm"
            onClick={() => setAddNoteOpen(true)}
          >
            <StickyNote className="h-3.5 w-3.5" /> إضافة ملاحظة
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-sm" asChild>
            <a
              href={`https://wa.me/${student.phone.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="h-3.5 w-3.5" /> واتساب
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-sm" asChild>
            <a href={`mailto:${student.email}`}>
              <Mail className="h-3.5 w-3.5" /> بريد إلكتروني
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditStudentDialog
        studentId={student.id}
        tutors={tutors}
        plans={plans}
        currencies={currencies}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <ChangeStatusDialog
        studentId={student.id}
        studentName={student.name}
        currentTutorId={student.tutorId}
        plans={plans}
        currentStatus={student.status}
        tutors={tutors}
        open={changeStatusOpen}
        onOpenChange={setChangeStatusOpen}
      />

      <AssignTutorDialog
        studentId={student.id}
        studentName={student.name}
        currentTutorId={student.tutorId}
        tutors={tutors}
        open={assignTutorOpen}
        onOpenChange={setAssignTutorOpen}
      />

      <AddNoteDialog
        studentId={student.id}
        studentName={student.name}
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
      />
    </>
  );
}
