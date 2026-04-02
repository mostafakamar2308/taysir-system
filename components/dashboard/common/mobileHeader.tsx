"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import SidebarContent from "@/components/dashboard/common/sidebarContent";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-background p-4 border-b md:hidden">
      <div className="font-bold text-lg">أكاديميتي</div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent showCloseButton={false} side="right" className="w-64 p-0">
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          <SheetDescription className="sr-only">
            الروابط الرئيسية للوحة التحكم
          </SheetDescription>
          <SidebarContent onItemClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
