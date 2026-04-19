"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, X } from "lucide-react";
import AddTutorDialog from "../dialogs/addTutorDialog";
import AddStudentDialog from "../dialogs/addStudentDialog";

interface EmptyStateProps {
  hasFilters: boolean;
  type: "students" | "tutors"
  currencies?: { id: number; name: string }[];
  tutors?: { id: number; name: string | null }[];
  specialities?: {
    id: number;
    title: string;
  }[];
  plans?: {
    id: number;
    title: string;
  }[];
  academyId: number;
  onClear: () => void;
}

export function EmptyState({ hasFilters, academyId, plans, specialities, currencies, tutors, type, onClear }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 shadow-none">
      <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-4">
        {hasFilters ? (
          <>
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">لا توجد نتائج</h3>
              <p className="text-sm text-muted-foreground mt-1">
                جرّب تعديل الفلاتر أو مصطلح البحث
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              مسح الفلاتر
            </Button>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                لا يوجد {type === "tutors" ? "معلمين" : "طلاب"} بعد
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ابدأ بإضافة أول {type === "tutors" ? "معلم" : "طالب"} للنظام
              </p>
            </div>
          </>
        )}
        {currencies && specialities ? <AddTutorDialog
          currencies={currencies}
          specialities={specialities}
          academyId={academyId}
        /> : null}
        {tutors && plans && currencies ? <AddStudentDialog
          tutors={tutors}
          plans={plans}
          currencies={currencies}
          academyId={academyId}
        /> : null}
      </CardContent>
    </Card>
  );
}
