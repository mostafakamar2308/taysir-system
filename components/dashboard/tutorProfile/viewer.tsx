"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Clock,
  ArrowLeft,
} from "lucide-react";
import type { TutorProfile, TutorSession } from "@/types/tutor";
import { addTutorNote } from "@/actions/tutor";

import OverviewTab from "@/components/dashboard/tutorProfile/overviewTab";
import StudentsTab from "@/components/dashboard/tutorProfile/studentsTab";
import SessionsTab from "@/components/dashboard/tutorProfile/sessionsTab";
import PaymentsTab from "@/components/dashboard/tutorProfile/paymentsTab";
import CommunicationTab from "@/components/dashboard/tutorProfile/communicationTab";
import EditTutorDialog from "@/components/dashboard/tutorProfile/editTutorDialog";
import AddSessionDialog from "@/components/dashboard/tutorProfile/addSessionDialog";
import SessionDetailPanel from "@/components/dashboard/tutorProfile/sessionDetailsPanel";
import AddExpenseDialog from "@/components/dashboard/tutorProfile/addExpenseDialog";
import ReportsTab from "@/components/dashboard/tutorProfile/reportsTab";

interface TutorProfileClientProps {
  tutor: TutorProfile;
  currencies: { id: number; code: string; name: string }[];
}

export default function TutorProfileClient({ tutor }: TutorProfileClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TutorSession | null>(
    null,
  );
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  const handleAddNote = async (content: string) => {
    try {
      await addTutorNote(tutor.id, content);
      toast({ title: "تمت إضافة الملاحظة" });
      router.refresh();
    } catch (error) {
      console.log(error);

      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Back button */}
      <Link
        href="/dashboard/tutors"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        العودة للمعلمين
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                {tutor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{tutor.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{tutor.email}</span>
                    {tutor.phone && <span>{tutor.phone}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {tutor.timezone}
                    </span>
                  </div>
                </div>
                <Badge
                  className={
                    tutor.active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {tutor.active ? "نشط" : "غير نشط"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">سعر الحصة: </span>
                  <span className="font-bold">
                    {tutor.pricePerSession} {tutor.currency}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">الطلاب: </span>
                  <span className="font-bold">{tutor.students.length}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tutor.specialities.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {tutor.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://wa.me/${tutor.phone.replace("+", "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageSquare className="h-4 w-4" /> واتساب
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${tutor.email}`}>
                    <Mail className="h-4 w-4" /> بريد إلكتروني
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4" /> تعديل
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/sessions">
                    <Calendar className="h-4 w-4" /> الجدول
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
            { val: "students", label: "الطلاب" },
            { val: "sessions", label: "الحصص" },
            { val: "reports", label: "التقارير" },
            { val: "payments", label: "المالية" },
            { val: "communication", label: "التواصل" },
          ].map((t) => (
            <TabsTrigger
              key={t.val}
              value={t.val}
              className="flex-1 min-w-22.5 text-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab tutor={tutor} />
        </TabsContent>
        <TabsContent value="students">
          <StudentsTab tutor={tutor} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab
            tutor={tutor}
            onSessionClick={(session) => {
              setSelectedSession(session);
              setSessionDetailOpen(true);
            }}
            onAddSession={() => setAddSessionOpen(true)}
          />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab
            tutor={tutor}
            onAddExpense={() => setAddExpenseOpen(true)}
          />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab tutor={tutor} />
        </TabsContent>
        <TabsContent value="communication">
          <CommunicationTab tutor={tutor} onAddNote={handleAddNote} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditTutorDialog
        tutor={tutor}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AddSessionDialog
        open={addSessionOpen}
        onOpenChange={setAddSessionOpen}
        tutorId={tutor.id}
        academyId={tutor.academyId}
        studentOptions={tutor.students.map((s) => ({ id: s.id, name: s.name }))}
      />

      {selectedSession && (
        <SessionDetailPanel
          session={selectedSession}
          open={sessionDetailOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedSession(null);
            setSessionDetailOpen(open);
          }}
          onDeleted={() => setSelectedSession(null)}
        />
      )}

      <AddExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        tutorId={tutor.id}
        tutorName={tutor.name}
        currencyId={tutor.currencyId}
        academyId={tutor.academyId}
      />
    </div>
  );
}
