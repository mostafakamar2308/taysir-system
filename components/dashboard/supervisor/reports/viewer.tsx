"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ClipboardCheck, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendReportReminder } from "@/actions/supervisor/reminders";
import { formatDate, formatTime } from "@/lib/dates";
import type {
  MissingReportItem,
  PendingTutorReviewItem,
} from "@/app/[locale]/dashboard/supervisor/reports/page";

interface Props {
  missingReportItems: MissingReportItem[];
  pendingTutorReviewItems: PendingTutorReviewItem[];
}

export default function SupervisorReportsViewer({
  missingReportItems,
  pendingTutorReviewItems,
}: Props) {
  const t = useTranslations("SupervisorReports");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleRemindTutor = async (sessionId: number) => {
    setLoading(true);
    try {
      await sendReportReminder(sessionId);
      toast({ title: t("buttons.reminderSent") });
    } catch (error) {
      toast({
        title: t("toast.error"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sessionUrl = (sessionId: number) =>
    `/dashboard/supervisor/sessions?sessionId=${sessionId}`;

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              {t("missingReports.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {missingReportItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                {t("missingReports.empty")}
              </p>
            ) : (
              missingReportItems.map((item) => (
                <div
                  key={item.sessionId}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-sm">{item.tutorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.startTime)} •{" "}
                        {formatTime(item.startTime)}
                        {item.topic ? ` • ${item.topic}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.missingStudents.map((name, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={sessionUrl(item.sessionId)}>
                        {t("buttons.review")}
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemindTutor(item.sessionId)}
                      disabled={loading}
                    >
                      <Send className="h-3.5 w-3.5 ml-1" />
                      {t("buttons.remindTutor")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-purple-600" />
              {t("tutorReviews.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTutorReviewItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                {t("tutorReviews.empty")}
              </p>
            ) : (
              pendingTutorReviewItems.map((item) => (
                <div
                  key={item.sessionId}
                  className="rounded-lg border p-3 flex items-center justify-between flex-wrap gap-2"
                >
                  <div>
                    <p className="font-medium text-sm">{item.tutorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.groupName} • {formatDate(item.startTime)} •{" "}
                      {formatTime(item.startTime)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {t("tutorReviews.notReviewed")}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={sessionUrl(item.sessionId)}>
                        {t("buttons.review")}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
