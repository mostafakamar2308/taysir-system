"use client";

import { useState } from "react";
import Link from "next/link";
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
}

export default function DashboardClient({
  todaySessions,
  upcomingSessions,
  pendingAttendance,
  pendingReports,
  financialSummary,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const totalPending = pendingAttendance.length + pendingReports.length;

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مرحباً بك في لوحة تحكم المعلم
        </p>
      </div>

      {/* Pending Actions Alert */}
      {totalPending > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  إجراءات معلقة
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {pendingAttendance.length} حصة بحاجة لتسجيل حضور،{" "}
                  {pendingReports.length} حصة بحاجة لتقرير
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tutor/sessions?filter=pending">عرض الكل</Link>
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
              <p className="text-xs text-muted-foreground">حصص اليوم</p>
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
              <p className="text-xs text-muted-foreground">الحصص القادمة</p>
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
              <p className="text-xs text-muted-foreground">الحصص هذا الشهر</p>
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
              <p className="text-xs text-muted-foreground">المستحق هذا الشهر</p>
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
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="today">حصص اليوم</TabsTrigger>
          <TabsTrigger value="upcoming">الحصص القادمة</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Today's Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">حصص اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  لا توجد حصص اليوم
                </p>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((s) => (
                    <SessionItem key={s.id} session={s} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                ملخص مالي للشهر الحالي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">عدد الحصص</span>
                <span className="font-medium">
                  {financialSummary.totalSessions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">المستحق</span>
                <span className="font-medium">
                  {formatCurrency(
                    financialSummary.expectedEarnings,
                    financialSummary.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">تم دفعه</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(
                    financialSummary.paidThisMonth,
                    financialSummary.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">المتبقي</span>
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
                <CardTitle className="text-base">إجراءات معلقة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingAttendance.length > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                      <span>
                        {pendingAttendance.length} حصة بحاجة لتسجيل حضور
                      </span>
                    </div>
                    <Button size="sm" variant="link" asChild>
                      <Link href="/tutor/sessions?filter=pending_attendance">
                        تسجيل
                      </Link>
                    </Button>
                  </div>
                )}
                {pendingReports.length > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span>{pendingReports.length} حصة بحاجة لتقرير</span>
                    </div>
                    <Button size="sm" variant="link" asChild>
                      <Link href="/tutor/sessions?filter=pending_reports">
                        كتابة
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
              <CardTitle className="text-base">حصص اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  لا توجد حصص اليوم
                </p>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((s) => (
                    <SessionItem key={s.id} session={s} />
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
              <CardTitle className="text-base">الحصص القادمة</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  لا توجد حصص قادمة
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((s) => (
                    <SessionItem key={s.id} session={s} />
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
function SessionItem({ session }: { session: SessionData }) {
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
            لم يسجل
          </Badge>
        )}
        {!session.hasReport && (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            بدون تقرير
          </Badge>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/ar/dashboard/tutor/sessions?sessionId=${session.id}`}>
            عرض
          </Link>
        </Button>
      </div>
    </div>
  );
}
