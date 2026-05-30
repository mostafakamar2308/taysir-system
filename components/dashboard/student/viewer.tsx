"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dayjs from "@/lib/dayjs";
import { sessionStatusLabels } from "@/lib/enums";
import {
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  BookOpen,
  Repeat,
  Calendar,
  FileText,
  DollarSign,
} from "lucide-react";
import { SessionReportCard } from "./sessionReportCard";
import { SessionStatus } from "@/types/session";
import { RatingChart } from "./ratingChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StudentDashboardProps {
  student: {
    id: number;
    name: string;
    timezone: string;
    imageUrl: string | null;
    tutorName: string | null;
    plan: {
      title: string;
      sessionsPerWeek: number;
      price: number;
      currency: string;
      billingPeriod: number;
    } | null;
  };
  nextSession: {
    id: number;
    startTime: string;
    endTime: string;
    tutorName: string;
    zoomJoinUrl: string | null;
    topic: string | null;
  } | null;
  monthlyAnalytics: {
    totalMonthlySessions: number;
    remainingMonthlySessions: number;
    renewalDate: string | null;
  };
  lastReport: {
    sessionDate: string;
    topic?: string | null;
    report: {
      rating: number | null;
      outcomes: string | null;
      strengths: string | null;
      weaknesses: string | null;
      nextGoals: string | null;
    };
  } | null;
  sessions: {
    id: number;
    startTime: string;
    endTime: string;
    topic: string | null;
    tutorName: string;
    status: number;
    attendance: { studentStatus: number } | null;
    hasReport: boolean;
    reportId: number | null;
  }[];
  reports: {
    sessionDate: string;
    topic?: string | null;
    rating: number | null;
    outcomes: string | null;
    strengths: string | null;
    weaknesses: string | null;
    nextGoals: string | null;
  }[];
  activeSubscription: {
    id: number;
    planTitle: string;
    planSessionsPerWeek: number;
    planPrice: number;
    planCurrency: string;
    startDate: string;
    endDate: string | null;
    payments: {
      amount: number;
      currency: string;
      status: number;
      date: string;
      method: number | null;
    }[];
  } | null;
  defaultCurrency: { code: string; symbol: string };
}

export function StudentDashboardClient(props: StudentDashboardProps) {
  const {
    student,
    nextSession,
    monthlyAnalytics,
    lastReport,
    sessions,
    reports,
    activeSubscription,
  } = props;

  const [timeToNextSession, setTimeToNextSession] = useState<string | null>(
    null,
  );
  const [showJoinButton, setShowJoinButton] = useState(false);
  const chartData = reports
    .filter((r) => r.rating !== null)
    .map((r) => ({
      sessionDate: r.sessionDate,
      rating: r.rating as number,
    }));
  const getStatusBadge = (status: number) => {
    const label = sessionStatusLabels[status as SessionStatus] || "غير معروف";
    let variant: "default" | "secondary" | "destructive" | "outline" =
      "default";
    let icon = null;
    if (status === SessionStatus.COMPLETED) {
      variant = "secondary";
      icon = <CheckCircle className="h-4 w-4 ml-1 text-green-600" />;
    } else if (status === SessionStatus.CANCELLED) {
      variant = "destructive";
      icon = <XCircle className="h-4 w-4 ml-1 text-red-600" />;
    } else if (status === SessionStatus.SCHEDULED) {
      variant = "outline";
      icon = <AlertCircle className="h-4 w-4 ml-1 text-blue-600" />;
    }
    return { label, variant, icon };
  };

  useEffect(() => {
    if (!nextSession) return;

    const updateCountdown = () => {
      const now = dayjs.utc();
      const start = dayjs.utc(nextSession.startTime);
      const diffSeconds = start.diff(now, "second");

      if (diffSeconds <= 0) {
        setTimeToNextSession("الآن");
        setShowJoinButton(true);
        return;
      }

      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;
      setTimeToNextSession(`${minutes}:${seconds.toString().padStart(2, "0")}`);

      if (diffSeconds <= 60) {
        setShowJoinButton(true);
      } else {
        setShowJoinButton(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextSession]);

  const hasUpcomingSession = nextSession !== null;

  return (
    <div className="min-h-screen pb-10 relative" dir="rtl">
      {/* اللافتة العلوية */}
      {hasUpcomingSession && (
        <div className="bg-primary text-primary-foreground shadow-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>
              لديك حصة مع أستاذ {nextSession!.tutorName} خلال{" "}
              <span className="font-bold">{timeToNextSession}</span>
            </span>
          </div>
          {showJoinButton && nextSession!.zoomJoinUrl && (
            <Button size="sm" variant="secondary" asChild>
              <a
                href={nextSession!.zoomJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                انضم الآن
                <ExternalLink className="h-4 w-4 mr-1" />
              </a>
            </Button>
          )}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pt-14">
        {/* بطاقة الترحيب */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.imageUrl ?? undefined} />
              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">أهلاً يا {student.name}</h2>
              {hasUpcomingSession ? (
                <p className="text-muted-foreground mt-1">
                  حصتك القادمة مع أستاذ {nextSession!.tutorName} تبدأ{" "}
                  {dayjs.utc(nextSession!.startTime).format("dddd hh:mm A")}
                </p>
              ) : (
                <p className="text-muted-foreground mt-1">ليس لديك حصص قادمة</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* التحليلات الشهرية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                إجمالي الحصص الشهرية
              </p>
              <p className="text-3xl font-bold">
                {monthlyAnalytics.totalMonthlySessions}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                الحصص المتبقية هذا الشهر
              </p>
              <p className="text-3xl font-bold">
                {monthlyAnalytics.remainingMonthlySessions}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">تاريخ التجديد</p>
              <p className="text-3xl font-bold">
                {monthlyAnalytics.renewalDate
                  ? dayjs.utc(monthlyAnalytics.renewalDate).format("DD/MM/YYYY")
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {lastReport && (
          <div className="flex flex-wrap gap-4">
            <Card className="grow-3">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  تقرير آخر حصة (يوم{" "}
                  {dayjs
                    .utc(lastReport.sessionDate)
                    .format("DD/MM/YYYY الساعة HH:mm")}
                  )
                </h3>
                <SessionReportCard
                  report={{
                    ...lastReport.report,
                    sessionDate: lastReport.sessionDate,
                    topic: lastReport.topic,
                  }}
                />
              </CardContent>
            </Card>
            <div className="grow">
              <RatingChart ratings={chartData} />
            </div>
          </div>
        )}

        {/* التبويبات */}
        <Tabs defaultValue="sessions">
          <TabsList dir="rtl" className="w-full">
            <TabsTrigger value="sessions" className="flex-1">
              الحصص
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">
              التقارير
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex-1">
              الفوترة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <div
              dir="rtl"
              className="rounded-lg border bg-card overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-l from-primary/10 to-primary/5 hover:bg-linear-to-l hover:from-primary/10 hover:to-primary/5">
                    <TableHead className="text-right font-semibold">
                      التاريخ
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الوقت
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      المعلم
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الموضوع
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الحالة
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s, idx) => {
                    const badge = getStatusBadge(s.status);
                    const isEven = idx % 2 === 0;
                    return (
                      <TableRow
                        key={s.id}
                        className={`${
                          isEven ? "bg-card" : "bg-muted/20"
                        } hover:bg-primary/5 transition-colors`}
                      >
                        <TableCell className="font-medium">
                          {dayjs.utc(s.startTime).format("DD/MM/YYYY")}
                        </TableCell>
                        <TableCell>
                          <span className="bg-muted px-2 py-1 rounded text-xs">
                            {dayjs.utc(s.startTime).format("HH:mm")} -{" "}
                            {dayjs.utc(s.endTime).format("HH:mm")}
                          </span>
                        </TableCell>
                        <TableCell>{s.tutorName}</TableCell>
                        <TableCell>{s.topic ?? "—"}</TableCell>
                        <TableCell className="flex">
                          <Badge
                            variant={badge.variant}
                            className="flex w-fit items-center gap-1"
                          >
                            {badge.icon}
                            {badge.label}
                          </Badge>
                          {s.hasReport && (
                            <span className="mr-2 text-green-600 text-xs">
                              ● تقرير
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((r, idx) => (
                <SessionReportCard key={idx} report={r} />
              ))}
              {reports.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  لا توجد تقارير بعد
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="billing">
            {activeSubscription ? (
              <div className="space-y-4">
                {/* بطاقة الاشتراك الحالي */}
                <Card className="bg-linear-to-br from-card to-primary/5 border shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      الاشتراك الحالي
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">الخطة:</span>
                        <span className="font-medium">
                          {activeSubscription.planTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">أسبوعياً:</span>
                        <span className="font-medium">
                          {activeSubscription.planSessionsPerWeek} حصة
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          سعر الخطة:
                        </span>
                        <span className="font-semibold text-primary">
                          {activeSubscription.planPrice}
                        </span>
                        <span className="text-muted-foreground">
                          {activeSubscription.planCurrency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">البداية:</span>
                        <span className="font-medium">
                          {dayjs
                            .utc(activeSubscription.startDate)
                            .format("DD/MM/YYYY")}
                        </span>
                      </div>
                      {activeSubscription.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            الانتهاء:
                          </span>
                          <span className="font-medium">
                            {dayjs
                              .utc(activeSubscription.endDate)
                              .format("DD/MM/YYYY")}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* سجل المدفوعات */}
                <Card className="border shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      سجل المدفوعات
                    </h3>
                    {activeSubscription.payments.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-6">
                        لا توجد مدفوعات مسجلة
                      </p>
                    ) : (
                      <div
                        dir="rtl"
                        className="rounded-lg border bg-card overflow-hidden"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-linear-to-l from-primary/10 to-primary/5 hover:bg-linear-to-l hover:from-primary/10 hover:to-primary/5">
                              <TableHead className="text-right font-semibold">
                                التاريخ
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                المبلغ
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                الحالة
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeSubscription.payments.map((p, i) => {
                              const isEven = i % 2 === 0;
                              const isPaid = p.status === 1;
                              return (
                                <TableRow
                                  key={i}
                                  className={`${
                                    isEven ? "bg-card" : "bg-muted/20"
                                  } hover:bg-primary/5 transition-colors`}
                                >
                                  <TableCell className="font-medium">
                                    {dayjs.utc(p.date).format("DD/MM/YYYY")}
                                  </TableCell>
                                  <TableCell>
                                    {p.amount} {p.currency}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={isPaid ? "secondary" : "outline"}
                                      className={`flex w-fit items-center gap-1 ${
                                        isPaid
                                          ? "bg-green-100 text-green-700"
                                          : "text-orange-600"
                                      }`}
                                    >
                                      {isPaid ? (
                                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                                      )}
                                      {isPaid ? "مدفوع" : "معلق"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border shadow-sm">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>لا يوجد اشتراك نشط حالياً</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
