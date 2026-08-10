"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  AlertCircle,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import type { SupervisorSessionItem } from "@/app/[locale]/dashboard/supervisor/page";

interface Props {
  todaySessions: SupervisorSessionItem[];
  upcomingSessions: SupervisorSessionItem[];
  pendingAttendance: number;
  pendingReports: number;
  pendingTutorReviews: number;
  tutorsMonitored: number;
}

export default function SupervisorOverviewViewer({
  todaySessions,
  upcomingSessions,
  pendingAttendance,
  pendingReports,
  pendingTutorReviews,
  tutorsMonitored,
}: Props) {
  const t = useTranslations("SupervisorDashboard");
  const totalPending =
    pendingAttendance + pendingReports + pendingTutorReviews;

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

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
                    attendance: pendingAttendance,
                    reports: pendingReports,
                    reviews: pendingTutorReviews,
                  })}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/supervisor/sessions">
                {t("buttons.viewSessions")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("summaryCards.tutorsMonitored")}
              </p>
              <p className="text-2xl font-bold">{tutorsMonitored}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("summaryCards.pendingReviews")}
              </p>
              <p className="text-2xl font-bold">{pendingTutorReviews}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("todaySection.title")}</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("upcomingSection.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {t("upcomingSection.empty")}
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 8).map((s) => (
                  <SessionItem key={s.id} session={s} t={t} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SessionItem({
  session,
  t,
}: {
  session: SupervisorSessionItem;
  t: ReturnType<typeof useTranslations<"SupervisorDashboard">>;
}) {
  const names = session.studentNames.join("، ");

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="min-w-0">
        <p className="font-medium text-sm">{session.tutorName}</p>
        <p className="text-xs text-muted-foreground truncate">{names}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(session.startTime)} • {formatTime(session.startTime)} –{" "}
          {formatTime(session.endTime)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
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
        {session.hasTutorReviewMissing && (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            {t("sessionItem.noTutorReview")}
          </Badge>
        )}
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/dashboard/supervisor/sessions?sessionId=${session.id}`}>
            {t("sessionItem.view")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
