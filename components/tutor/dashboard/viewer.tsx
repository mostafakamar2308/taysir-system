"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  UserCheck,
  FileSignature,
} from "lucide-react";
import { formatCurrency } from "@/lib/finances";
import { formatDate, formatTime } from "@/lib/dates";
import { SessionCountdownBanner } from "@/components/dashboard/common/sessionCountdownBanner";
import AttendanceDialog from "./attendanceDialog";
import ReportDialog from "./reportDialog";
import type { SessionSummary } from "./types";
import { AttendanceStatus } from "@/types/session";

// ---------- props ----------
interface DashboardClientProps {
  todaySessions: SessionSummary[];
  upcomingSessions: SessionSummary[];
  pendingAttendance: SessionSummary[];
  pendingReports: SessionSummary[];
  sessionsWithMissingData: SessionSummary[];
  financialSummary: {
    totalSessions: number;
    expectedEarnings: number;
    paidThisMonth: number;
    remainingEarnings: number;
    currency: string;
  };
  zoomEnabled: boolean;
}

// ---------- component ----------
export default function DashboardClient({
  todaySessions,
  upcomingSessions,
  pendingAttendance,
  pendingReports,
  sessionsWithMissingData,
  financialSummary,
  zoomEnabled,
}: DashboardClientProps) {
  const t = useTranslations("TutorDashboard");
  const [activeTab, setActiveTab] = useState("overview");
  const totalPending = pendingAttendance.length + pendingReports.length;

  // Dialog state for the missing-data tab
  const [attendanceSession, setAttendanceSession] =
    useState<SessionSummary | null>(null);
  const [reportSession, setReportSession] = useState<SessionSummary | null>(
    null,
  );

  const bannerSessions = useMemo(
    () =>
      [...todaySessions, ...upcomingSessions].map((s) => ({
        key: String(s.id),
        startTime: s.startTime,
        endTime: s.endTime,
        joinUrl: s.meetingLink ?? null,
        renderMessage: (time: string) =>
          t("banner.message", {
            students: s.participants.map((p) => p.studentName).join("، ") || "—",
            time,
          }),
      })),
    [todaySessions, upcomingSessions, t],
  );

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Live / upcoming session banner */}
      {bannerSessions.length > 0 && (
        <SessionCountdownBanner
          sessions={bannerSessions}
          nowLabel={t("countdown.now")}
          joinLabel={t("banner.joinButton")}
        />
      )}

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
            <Button variant="outline" size="sm" onClick={() => setActiveTab("missing")}>
              {t("pendingAlert.viewAll")}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="today">{t("tabs.today")}</TabsTrigger>
          <TabsTrigger value="upcoming">{t("tabs.upcoming")}</TabsTrigger>
          <TabsTrigger value="missing" className="relative">
            {t("tabs.missing")}
            {sessionsWithMissingData.length > 0 && (
              <Badge
                variant="secondary"
                className="mr-1 h-5 min-w-5 px-1 text-[10px] inline-flex items-center justify-center rounded-full"
              >
                {sessionsWithMissingData.length}
              </Badge>
            )}
          </TabsTrigger>
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

        {/* Missing Data Tab */}
        <TabsContent value="missing">
          {sessionsWithMissingData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <p className="font-medium text-foreground">
                  {t("missingData.empty")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessionsWithMissingData.map((s) => (
                <MissingDataCard
                  key={s.id}
                  session={s}
                  t={t}
                  onAttendance={() => setAttendanceSession(s)}
                  onReport={() => setReportSession(s)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Missing-data dialogs */}
      <AttendanceDialog
        open={attendanceSession !== null}
        onOpenChange={(open) => {
          if (!open) setAttendanceSession(null);
        }}
        title={
          attendanceSession
            ? t("missingData.attendanceDialogTitle", {
                date: formatDate(attendanceSession.startTime),
              })
            : ""
        }
        participants={
          attendanceSession
            ? attendanceSession.participants.filter((p) => p.attendanceStatus === null)
            : []
        }
      />
      <ReportDialog
        open={reportSession !== null}
        onOpenChange={(open) => {
          if (!open) setReportSession(null);
        }}
        title={
          reportSession
            ? t("missingData.reportDialogTitle", {
                date: formatDate(reportSession.startTime),
              })
            : ""
        }
        participants={
          reportSession
            ? reportSession.participants.filter((p) => {
                const attended =
                  p.attendanceStatus !== null &&
                  [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
                    p.attendanceStatus,
                  );
                return attended && !p.hasReport;
              })
            : []
        }
      />
    </div>
  );
}

// ---------- Session Item (updated) ----------
function SessionItem({
  session,
  t,
}: {
  session: SessionSummary;
  t: ReturnType<typeof useTranslations<"TutorDashboard">>;
}) {
  const studentNames = session.participants
    .map((p) => p.studentName)
    .join("، ");

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div>
        <p className="font-medium text-sm">{studentNames}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(session.startTime)} • {formatTime(session.startTime)} –{" "}
          {formatTime(session.endTime)}
        </p>
        {session.topic && (
          <p className="text-xs text-muted-foreground mt-1">{session.topic}</p>
        )}
      </div>
      <div className="flex gap-2">
        {session.hasAnyAttendanceMissing && (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            {t("sessionItem.noAttendance")}
          </Badge>
        )}
        {session.hasAnyReportMissing && (
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

// ---------- Missing Data Card ----------
function MissingDataCard({
  session,
  t,
  onAttendance,
  onReport,
}: {
  session: SessionSummary;
  t: ReturnType<typeof useTranslations<"TutorDashboard">>;
  onAttendance: () => void;
  onReport: () => void;
}) {
  const missingAttendance = session.participants.filter(
    (p) => p.attendanceStatus === null,
  );
  const missingReports = session.participants.filter((p) => {
    const attended =
      p.attendanceStatus !== null &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        p.attendanceStatus,
      );
    return attended && !p.hasReport;
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {formatDate(session.startTime)} • {formatTime(session.startTime)} –{" "}
              {formatTime(session.endTime)}
            </p>
            {session.topic && (
              <p className="text-sm font-medium mt-1">{session.topic}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {t("missingData.students", {
                students: session.participants
                  .map((p) => p.studentName)
                  .join("، "),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            {missingAttendance.length > 0 && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                <UserCheck className="h-3 w-3 ml-1" />
                {t("missingData.hintAttendance", {
                  count: missingAttendance.length,
                })}
              </Badge>
            )}
            {missingReports.length > 0 && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                <FileSignature className="h-3 w-3 ml-1" />
                {t("missingData.hintReport", {
                  count: missingReports.length,
                })}
              </Badge>
            )}
          </div>
        </div>

        {/* Per-student hints */}
        {missingAttendance.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-amber-700">
              {t("missingData.attendanceMissingLabel")}:
            </span>{" "}
            {missingAttendance.map((p) => p.studentName).join("، ")}
          </div>
        )}
        {missingReports.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-blue-700">
              {t("missingData.reportMissingLabel")}:
            </span>{" "}
            {missingReports.map((p) => p.studentName).join("، ")}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {missingAttendance.length > 0 && (
            <Button size="sm" variant="outline" onClick={onAttendance}>
              <UserCheck className="h-4 w-4 ml-1" />
              {t("missingData.recordAttendance")}
            </Button>
          )}
          {missingReports.length > 0 && (
            <Button size="sm" variant="outline" onClick={onReport}>
              <FileSignature className="h-4 w-4 ml-1" />
              {t("missingData.writeReport")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
