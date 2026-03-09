"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, X } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onClear: () => void;
}

export function EmptyState({ hasFilters, onClear }: EmptyStateProps) {
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
                لا يوجد طلاب بعد
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ابدأ بإضافة أول طالب للنظام
              </p>
            </div>
            <Button size="sm" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              إضافة طالب
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
