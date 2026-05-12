"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Mail, Clock, BookOpen, DollarSign, Globe } from "lucide-react";
import { DashboardTutor } from "@/types/tutor";
import { QuickActionsMenu } from "@/components/dashboard/tutors/quickActionsMenu";
import Link from "next/link";

interface TutorCardProps {
  tutor: DashboardTutor;
  isSelected: boolean;
  onSelect: () => void;
  selectionMode: boolean;
}

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
};

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  inactive: "bg-muted text-muted-foreground",
};

export default function TutorCard({
  tutor,
  isSelected,
  onSelect,
  selectionMode,
}: TutorCardProps) {
  const statusKey = tutor.status ? "active" : "inactive";

  return (
    <Card
      className={`border-none shadow-sm hover:shadow-md transition-shadow ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {selectionMode && (
              <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            )}
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {tutor.name.charAt(0)}
              </span>
            </div>
            <div>
              <Link href={`/ar/dashboard/tutors/${tutor.id}`}>
                <h3 className="font-semibold text-foreground hover:text-primary hover:underline">
                  {tutor.name}
                </h3>
              </Link>
              <p className="text-xs text-muted-foreground">
                {tutor.specialities.join(" · ") || "بدون تخصص"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[statusKey]}`}
            >
              {statusLabels[statusKey]}
            </span>
            <QuickActionsMenu tutor={tutor} />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>
              {tutor.pricePerHour} {tutor.currency} / ساعة
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{tutor.timezone.split("/")[1]}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span>{tutor.studentCount} طالب</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{tutor.timetable.length} أيام / أسبوع</span>
          </div>
        </div>

        {/* Timetable */}
        {tutor.timetable.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-border">
            <p className="text-xs font-medium text-foreground">
              الجدول الأسبوعي
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tutor.timetable.slice(0, 3).map((slot, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
                >
                  {slot.day} {slot.from}-{slot.to}
                </span>
              ))}
              {tutor.timetable.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{tutor.timetable.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${tutor.phone.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${tutor.email}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
          <span className="text-xs text-muted-foreground">
            انضم {new Date(tutor.createdAt).toLocaleDateString("ar-EG")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
