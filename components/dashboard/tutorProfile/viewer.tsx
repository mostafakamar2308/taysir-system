"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Mail, Edit, ArrowLeft } from "lucide-react";
import type { TutorProfile } from "@/types/tutor";
import OverviewTab from "./overviewTab";
import GroupsTab from "./groupsTab";
import SessionsTab from "./sessionsTab";
import EditTutorDialog from "@/components/dashboard/tutorProfile/editTutorDialog";

interface Props {
  tutor: TutorProfile;
  academyId: number;
}

export default function TutorProfileClient({ tutor, academyId }: Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <Link
        href="/dashboard/tutors"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        العودة للمعلمين
      </Link>

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
                    <span>{tutor.timezone}</span>
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
                  <span className="text-muted-foreground">
                    سعر الساعة (خاص):{" "}
                  </span>
                  <span className="font-bold">
                    {tutor.baseHourlyRate} {tutor.currency}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    سعر الساعة (مجموعة):{" "}
                  </span>
                  <span className="font-bold">
                    {tutor.baseGroupHourlyRate} {tutor.currency}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">المجموعات: </span>
                  <span className="font-bold">{tutor.groups.length}</span>
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="overview" className="flex-1">
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1">
            المجموعات
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1">
            الحصص
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab tutor={tutor} />
        </TabsContent>
        <TabsContent value="groups">
          <GroupsTab tutor={tutor} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab tutorId={tutor.id} academyId={academyId} />
        </TabsContent>
      </Tabs>

      <EditTutorDialog
        tutor={tutor}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
