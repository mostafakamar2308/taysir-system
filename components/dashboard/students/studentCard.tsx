"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardStudent, StudentStatus } from "@/types/student";
import { Phone, Mail, Clock, BookOpen, Book, AppWindow } from "lucide-react";
import { QuickActionsMenu } from "./quickActionsMenu";
import { Currency } from "@/generated/prisma/client";

type StudentCardProps = {
  student: DashboardStudent;
  tutors: { id: number; name: string }[];
  plans: { id: number; title: string }[];
  currencies: Currency[];
  academyId?: number;
};

const statusLabels: Record<StudentStatus, string> = {
  [StudentStatus.trial]: "تجريبي",
  [StudentStatus.subscribed]: "مشترك",
  [StudentStatus.lead]: "عميل محتمل",
  [StudentStatus.churned]: "منسحب",
  [StudentStatus.paused]: "متوقف",
};

const statusColors: Record<StudentStatus, string> = {
  [StudentStatus.trial]: "bg-blue-100 text-blue-700",
  [StudentStatus.subscribed]: "bg-green-100 text-green-700",
  [StudentStatus.lead]: "bg-amber-100 text-amber-700",
  [StudentStatus.churned]: "bg-red-100 text-red-700",
  [StudentStatus.paused]: "bg-gray-100 text-gray-700",
};

const StudentCard = ({
  student,
  currencies,
  plans,
  tutors,
}: StudentCardProps) => {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {student.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{student.name}</h3>
              <p className="text-xs text-muted-foreground">{student.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[student.status]}`}
            >
              {statusLabels[student.status]}
            </span>
            <QuickActionsMenu
              tutors={tutors}
              plans={plans}
              currencies={currencies}
              student={student}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{student.tutorName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{student.timezone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AppWindow className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {student.currentProgram || "لا يوجد برنامج"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Book className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {student.planName || "لا يوجد خطة"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${student.phone.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${student.email}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
          {/* Add source badge if you have source field */}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
