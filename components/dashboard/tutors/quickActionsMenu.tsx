"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Phone,
  Mail,
  // UserPlus,
} from "lucide-react";
import { DashboardTutor } from "./viewer";
// import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import EditTutorDialog from "@/components/dashboard/tutorProfile/editTutorDialog";
import { useState } from "react";

export function QuickActionsMenu({ tutor }: { tutor: DashboardTutor }) {
  const [editTutor, setEditTutor] = useState(false);
  // const { toast } = useToast();
  const router = useRouter();

  // const handleAction = (action: string) => {
  //   toast({ title: `تم تنفيذ: ${action}` });
  // };

  return (
    <DropdownMenu dir="rtl">
      <EditTutorDialog
        tutor={tutor}
        open={editTutor}
        onOpenChange={setEditTutor}
      />
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/tutors/${tutor.id}`)}
          className="gap-2 text-sm"
        >
          <Eye className="h-3.5 w-3.5" /> عرض الملف
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setEditTutor(true)}
          className="gap-2 text-sm"
        >
          <Pencil className="h-3.5 w-3.5" /> تعديل
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-sm" asChild>
          {tutor.phone ? (
            <a
              href={`https://wa.me/${tutor.phone?.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="h-3.5 w-3.5" /> واتساب
            </a>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-sm" asChild>
          <a href={`mailto:${tutor.email}`}>
            <Mail className="h-3.5 w-3.5" /> بريد إلكتروني
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* <DropdownMenuItem
          onClick={() => handleAction("تعيين طلاب")}
          className="gap-2 text-sm"
        >
          <UserPlus className="h-3.5 w-3.5" /> تعيين طلاب
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
