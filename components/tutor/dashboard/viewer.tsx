"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation"; // i18n‑aware Link
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/finances";
import { formatDate, formatTime } from "@/lib/dates";

interface SessionData {
  id: number;
  startTime: string;
  endTime: string;
  topic: string | null;
  studentId: number;
  studentName: string;
  studentPhone: string | null;
  status: number;
  hasAttendance: boolean;
  hasReport: boolean;
  meetingLink?: string | null;
}

interface DashboardClientProps {
  todaySessions: SessionData[];
  upcomingSessions: SessionData[];
  pendingAttendance: SessionData[];
  pendingReports: SessionData[];
  financialSummary: {
    totalSessions: number;
    expectedEarnings: number;
    paidThisMonth: number;
    remainingEarnings: number;
    currency: string;
  };
  zoomEnabled: boolean;
}

export default function DashboardClient({
  todaySessions,
  upcomingSessions,
  pendingAttendance,
  pendingReports,
  financialSummary,
  zoomEnabled,
}: DashboardClientProps) {
  const t = useTranslations("TutorDashboard");
  const [activeTab, setActiveTab] = useState("overview");
  const totalPending = pendingAttendance.length + pendingReports.length;

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Zoom not connected alert */}
      {!zoomEnabled && (
        <Card className="border-red-300 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  {t("zoomAlert.title")}
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {t("zoomAlert.description")}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/tutor/zoom">{t("zoomAlert.link")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending actions alert */}
      {totalPending > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  {t("pendingAlert.title")}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t("pendingAlert.description", {
                    attendance: pendingAttendance.length,
                    reports: pendingReports.length,
                  })}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/tutor/sessions?view=table">
                {t("pendingAlert.viewAll")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("summaryCards.todaySessions")}
              </p>
              <p className="text-2xl font-bold">{todaySessions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("summaryCards.upcomingSessions")}
              </p>
              <p className="text-2xl font-bold">{upcomingSessions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("summaryCards.thisMonthSessions")}
              </p>
              <p className="text-2xl font-bold">
                {financialSummary.totalSessions}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("summaryCards.expectedEarnings")}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  financialSummary.expectedEarnings,
                  financialSummary.currency,
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="today">{t("tabs.today")}</TabsTrigger>
          <TabsTrigger value="upcoming">{t("tabs.upcoming")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Today's Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("todaySection.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t("todaySection.empty")}
                </p>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((s) => (
                    <SessionItem key={s.id} session={s} t={t} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("financialSummary.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("financialSummary.totalSessions")}
                </span>
                <span className="font-medium">
                  {financialSummary.totalSessions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("financialSummary.expected")}
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    financialSummary.expectedEarnings,
                    financialSummary.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("financialSummary.paid")}
                </span>
                <span className="font-medium text-green-600">
                  {formatCurrency(
                    financialSummary.paidThisMonth,
                    financialSummary.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">
                  {t("financialSummary.remaining")}
                </span>
                <span className="font-bold text-amber-600">
                  {formatCurrency(
                    financialSummary.remainingEarnings,
                    financialSummary.currency,
                  )}
                </span>
              </div>
              <Progress
                value={
                  (financialSummary.paidThisMonth /
                    financialSummary.expectedEarnings) *
                  100
                }
                className="h-2"
              />
            </CardContent>
          </Card>

          {/* Pending Actions */}
          {totalPending > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("pendingActions.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingAttendance.length > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                      <span>
                        {t("pendingActions.attendanceNeeded", {
                          count: pendingAttendance.length,
                        })}
                      </span>
                    </div>
                    <Button size="sm" variant="link" asChild>
                      <Link href="/dashboard/tutor/sessions?filter=pending_attendance">
                        {t("pendingActions.record")}
                      </Link>
                    </Button>
                  </div>
                )}
                {pendingReports.length > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span>
                        {t("pendingActions.reportNeeded", {
                          count: pendingReports.length,
                        })}
                      </span>
                    </div>
                    <Button size="sm" variant="link" asChild>
                      <Link href="/dashboard/tutor/sessions?filter=pending_reports">
                        {t("pendingActions.write")}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Today Tab */}
        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("todaySection.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t("todaySection.empty")}
                </p>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((s) => (
                    <SessionItem key={s.id} session={s} t={t} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("upcomingSection.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t("upcomingSection.empty")}
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((s) => (
                    <SessionItem key={s.id} session={s} t={t} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Session Item Component
function SessionItem({
  session,
  t,
}: {
  session: SessionData;
  t: ReturnType<typeof useTranslations<"TutorDashboard">>;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div>
        <p className="font-medium text-sm">{session.studentName}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(session.startTime)} • {formatTime(session.startTime)} –{" "}
          {formatTime(session.endTime)}
        </p>
        {session.topic && (
          <p className="text-xs text-muted-foreground mt-1">{session.topic}</p>
        )}
      </div>
      <div className="flex gap-2">
        {!session.hasAttendance && (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            {t("sessionItem.noAttendance")}
          </Badge>
        )}
        {!session.hasReport && (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            {t("sessionItem.noReport")}
          </Badge>
        )}
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/dashboard/tutor/sessions?sessionId=${session.id}`}>
            {t("sessionItem.view")}
          </Link>
        </Button>
        {session.meetingLink && (
          <Button variant="default" size="sm" asChild>
            <Link target="_blank" href={session.meetingLink}>
              {t("sessionItem.startSession")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
