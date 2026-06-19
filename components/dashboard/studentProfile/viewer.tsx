"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Mail,
  Edit,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { StudentStatus } from "@/types/student";
import { statusColors, statusLabels } from "@/lib/enums";
import EditStudentDialog from "../students/editStudentDialog";
import { Plan, StudentProfile } from "@/types/studentProfile";
import OverviewTab from "@/components/dashboard/studentProfile/overviewTab";
import SessionsTab from "@/components/dashboard/studentProfile/sessionsTab";
import AttendanceProgressTab from "@/components/dashboard/studentProfile/attendanceProgressTab";
import BillingTab from "@/components/dashboard/studentProfile/billingTab";
import RecordPaymentDialog from "./dialogs/recordPaymentDialog";
import { SubscriptionStatus } from "@/types/subscription";
import dayjs from "@/lib/dayjs";

interface StudentProfileClientProps {
  student: StudentProfile;
  plans: Plan[];
  tutors: { id: number; name: string | null }[];
  academyId: number;
  defaultCurrency: {
    code: string;
    symbol: string;
    name: string;
  };
  currencyRates: Record<string, number>;
}

export default function StudentProfileClient({
  student,
  plans,
  defaultCurrency,
  tutors,
  currencyRates,
}: StudentProfileClientProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recordPayment, setRecordPayment] = useState(false);

  const statusLabel = statusLabels[student.status as StudentStatus];
  const statusColor = statusColors[student.status as StudentStatus];

  const handleContact = () => {
    if (student.phone) {
      window.open(`https://wa.me/${student.phone.replace("+", "")}`, "_blank");
    }
  };

  const handleMarkPayment = () => {
    setRecordPayment(true);
  };

  const handleAddNote = () => {
    toast({ title: "إضافة ملاحظة" });
  };

  const handleViewAttendance = () => {
    setActiveTab("attendance");
  };

  const activeSubscription =
    student.subscriptions.find((s) => s.status === SubscriptionStatus.active) ||
    null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Back button */}
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        العودة للطلاب
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{student.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{student.age} سنة</span>
                    {student.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {student.country}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {student.timezone}
                    </span>
                  </div>
                </div>
                <Badge className={statusColor}>{statusLabel}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {student.tutorName && (
                  <div>
                    <span className="text-muted-foreground">المعلم: </span>
                    <Link
                      href={`/dashboard/tutors/${student.tutorId}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {student.tutorName}
                    </Link>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">
                    البريد الإلكتروني:{" "}
                  </span>
                  <span className="font-medium">{student.email}</span>
                </div>

                {student.plan && (
                  <div>
                    <span className="text-muted-foreground">الخطة: </span>
                    <span className="font-medium">{student.plan.title}</span>
                  </div>
                )}

                {activeSubscription && (
                  <div>
                    <span className="text-muted-foreground">
                      تاريخ انتهاء الاشتراك:{" "}
                    </span>
                    <span className="font-medium">
                      {dayjs(activeSubscription.endDate).format(
                        "dddd YYYY-MM-DD",
                      ) ||
                        dayjs(activeSubscription.startDate)
                          .add(30, "d")
                          .format("dddd YYYY-MM-DD")}
                    </span>
                  </div>
                )}
              </div>
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {student.phone && (
                  <Button size="sm" variant="outline" onClick={handleContact}>
                    <MessageSquare className="h-4 w-4 ml-2" /> واتساب
                  </Button>
                )}
                {student.email && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${student.email}`}>
                      <Mail className="h-4 w-4 ml-2" /> بريد
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 ml-2" /> تعديل
                </Button>
                <EditStudentDialog
                  studentId={student.id}
                  tutors={tutors}
                  open={editDialogOpen}
                  onOpenChange={() => setEditDialogOpen(false)}
                />
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/sessions">
                    <Calendar className="h-4 w-4 ml-2" /> الجدول
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
          {[
            { val: "overview", label: "نظرة عامة" },
            { val: "sessions", label: "الحصص" },
            { val: "attendance", label: "الحضور والتقدم" },
            { val: "billing", label: "المالية والخطة" },
          ].map((t) => (
            <TabsTrigger
              key={t.val}
              value={t.val}
              className="flex-1 min-w-25 text-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            student={student}
            onMarkPayment={handleMarkPayment}
            onContact={handleContact}
            onViewAttendance={handleViewAttendance}
            onAddNote={handleAddNote}
          />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTab tutors={tutors} student={student} />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceProgressTab student={student} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab
            student={student}
            defaultCurrency={defaultCurrency}
            plans={plans}
            currencyRates={currencyRates}
          />
        </TabsContent>
      </Tabs>
      <RecordPaymentDialog
        open={recordPayment}
        activeSubscriptionId={
          student.subscriptions.find(
            (s) => s.status === SubscriptionStatus.active,
          )?.id
        }
        onOpenChange={setRecordPayment}
        studentId={student.id}
        activeSubscriptionPricePerSession={activeSubscription?.pricePerSession}
        subscriptions={student.subscriptions}
      />
    </div>
  );
}
