"use client";

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
} from "lucide-react";

export function QuickActionsMenu({ student }: { student: DashboardStudent }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem className="gap-2 text-sm">
          <Eye className="h-3.5 w-3.5" /> عرض الملف
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-sm">
          <Pencil className="h-3.5 w-3.5" /> تعديل
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
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-sm">
          <RefreshCw className="h-3.5 w-3.5" /> تجديد الاشتراك
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-sm">
          <StickyNote className="h-3.5 w-3.5" /> إضافة ملاحظة
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
