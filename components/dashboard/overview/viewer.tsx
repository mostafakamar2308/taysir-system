"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import AddStudentDialog from "@/components/dashboard/dialogs/addStudentDialog";
import AddTutorDialog from "@/components/dashboard/dialogs/addTutorDialog";
import AddSessionDialog from "@/components/dashboard/dialogs/addSessionDialog";
import { AddRevenueDialog } from "../dialogs/addRevenueDialog";
import { AddExpenseDialog } from "../dialogs/addExpenseDialog";
import { useState } from "react";
import SendBulkMessagesDialog from "../common/SendBulkMessagesDialog";

interface StatItem {
  value: number;
  change: number;
}

interface DashboardClientProps {
  students: { id: number; name: string | null }[];
  tutors: { id: number; name: string | null }[];
  plans: { id: number; title: string }[];
  currencies: { id: number; name: string }[];
  specialities: { id: number; title: string }[];
  defaultCurrency: {
    code: string;
    symbol: string;
    name: string;
  };
  stats: {
    totalStudents: StatItem;
    subscribedStudents: StatItem;
    trialStudents: StatItem;
    leadStudents: StatItem;
    newStudentsThisWeek: StatItem;
    activeTutors: StatItem;
    totalSupervisors: StatItem;
    revenueThisMonth: StatItem;
    expenseThisMonth: StatItem;
    leadToTrialRate: StatItem;
    trialToSubscribedRate: StatItem;
  };
  atRiskStudents: Array<{
    id: number;
    name: string;
    phone: string | null;
    reason: string;
  }>;
  attendanceSheet: Array<{
    sessionId: number;
    studentId: number;
    studentName: string;
    studentPhone: string | null;
    tutorName: string | null;
    tutorPhone: string | null;
    startTime: string;
  }>;
  absentSessions: {
    sessionId: number;
    studentId: number;
    studentName: string;
    studentPhone: string | null;
    tutorName: string;
    tutorPhone: string | null;
    startTime: string;
  }[];
  latePayments: Array<{
    id: number;
    studentName: string;
    phone: string | null;
    planTitle: string;
    amountDue: number;
    daysOverdue: number;
  }>;
  nearEndSubscriptions: Array<{
    id: number;
    studentName: string;
    phone: string | null;
    planTitle: string;
    endDate: string;
    daysLeft: number;
  }>;
  reportsSheet: Array<{
    sessionId: number;
    tutorId: number;
    tutorName: string;
    tutorPhone: string | null;
    studentName: string;
    startTime: string;
  }>;
  academyId: number;
}

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: number | string;
  change: number;
}) {
  const isPositive = change > 0;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {change !== 0 && (
            <span
              className={`text-xs ${isPositive ? "text-green-600" : "text-red-600"} flex items-center`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 ml-1" />
              ) : (
                <TrendingDown className="h-3 w-3 ml-1" />
              )}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type BulkGroup =
  | "at-risk"
  | "late-payment"
  | "near-end"
  | "attendance-missing"
  | "attendance-absent"
  | "reports-missing"
  | "reports-absent"
  | null;

export default function DashboardClient(props: DashboardClientProps) {
  const formatTime = (iso: string) => dayjs(iso).format("h:mm A");

  const handleWhatsApp = (phone: string | null, text?: string) => {
    if (!phone) return;
    const url = `https://wa.me/${phone.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
    window.open(url, "_blank");
  };

  const [sendBulkMessages, setSendBulkMessages] = useState<BulkGroup>(null);

  const getBulkUsers = (): { phone: string }[] => {
    switch (sendBulkMessages) {
      case "at-risk":
        return props.atRiskStudents
          .filter((s) => s.phone)
          .map((s) => ({ phone: s.phone! }));
      case "late-payment":
        return props.latePayments
          .filter((p) => p.phone)
          .map((p) => ({ phone: p.phone! }));
      case "near-end":
        return props.nearEndSubscriptions
          .filter((s) => s.phone)
          .map((s) => ({ phone: s.phone! }));
      case "attendance-missing":
        return props.attendanceSheet
          .filter((s) => s.tutorPhone)
          .map((s) => ({ phone: s.tutorPhone! }));
      case "attendance-absent":
        return props.absentSessions
          .filter((s) => s.studentPhone)
          .map((s) => ({ phone: s.studentPhone! }));
      case "reports-missing":
        return props.reportsSheet
          .filter((s) => s.tutorPhone)
          .map((s) => ({ phone: s.tutorPhone! }));
      case "reports-absent":
        return props.absentSessions
          .filter((s) => s.studentPhone)
          .map((s) => ({ phone: s.studentPhone! }));
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على أداء الأكاديمية</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <AddStudentDialog
            currencies={props.currencies}
            plans={props.plans}
            tutors={props.tutors}
            academyId={props.academyId}
          >
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" /> إضافة طالب
            </Button>
          </AddStudentDialog>
          <AddTutorDialog
            currencies={props.currencies}
            academyId={props.academyId}
            specialities={props.specialities}
          >
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" /> إضافة معلم
            </Button>
          </AddTutorDialog>
          <AddSessionDialog
            tutors={props.tutors}
            students={props.students}
            academyId={props.academyId}
          >
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" /> إضافة حصة
            </Button>
          </AddSessionDialog>
          <AddExpenseDialog
            academyId={props.academyId}
            currencies={props.currencies}
            tutors={props.tutors}
          >
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" /> تسجيل مصروف
            </Button>
          </AddExpenseDialog>
          <AddRevenueDialog
            academyId={props.academyId}
            students={props.students}
          >
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" /> تسجيل إيراد
            </Button>
          </AddRevenueDialog>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="space-y-4">
        <h1 className="text-xl font-bold">إحصائيات المستخدمين</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="إجمالي الطلاب"
            value={props.stats.totalStudents.value}
            change={props.stats.totalStudents.change}
          />
          <StatCard
            label="معلمين نشطين"
            value={props.stats.activeTutors.value}
            change={props.stats.activeTutors.change}
          />
          <StatCard
            label="مشرفين"
            value={props.stats.totalSupervisors.value}
            change={props.stats.totalSupervisors.change}
          />
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">إحصائيات الطلاب</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="المشتركين"
            value={props.stats.subscribedStudents.value}
            change={props.stats.subscribedStudents.change}
          />
          <StatCard
            label="تجريبي"
            value={props.stats.trialStudents.value}
            change={props.stats.trialStudents.change}
          />
          <StatCard
            label="عملاء محتملين"
            value={props.stats.leadStudents.value}
            change={props.stats.leadStudents.change}
          />
          <StatCard
            label="طلاب جدد هذا الأسبوع"
            value={props.stats.newStudentsThisWeek.value}
            change={props.stats.newStudentsThisWeek.change}
          />
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">إحصائيات الماليات</h1>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="إيرادات هذا الشهر"
            value={`${props.stats.revenueThisMonth.value} ${props.defaultCurrency.name}`}
            change={props.stats.revenueThisMonth.change}
          />
          <StatCard
            label="مصروفات هذا الشهر"
            value={`${props.stats.expenseThisMonth.value} ${props.defaultCurrency.name}`}
            change={props.stats.expenseThisMonth.change}
          />
        </div>
      </div>
      {/* Conversion Rates */}
      <div className="space-y-4">
        <h1 className="text-xl font-bold">معدلات التحويل</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                تحويل Lead → Trial (آخر 30 يوم)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {props.stats.leadToTrialRate.value.toFixed(1)}%
                </p>
                {props.stats.leadToTrialRate.change !== 0 && (
                  <span
                    className={`text-xs ${props.stats.leadToTrialRate.change > 0 ? "text-green-600" : "text-red-600"} flex items-center`}
                  >
                    {props.stats.leadToTrialRate.change > 0 ? (
                      <TrendingUp className="h-3 w-3 ml-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 ml-1" />
                    )}
                    {Math.abs(props.stats.leadToTrialRate.change).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                مقارنة بالفترة السابقة (30-60 يوم)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                تحويل Trial → مشترك (آخر 30 يوم)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {props.stats.trialToSubscribedRate.value.toFixed(1)}%
                </p>
                {props.stats.trialToSubscribedRate.change !== 0 && (
                  <span
                    className={`text-xs ${props.stats.trialToSubscribedRate.change > 0 ? "text-green-600" : "text-red-600"} flex items-center`}
                  >
                    {props.stats.trialToSubscribedRate.change > 0 ? (
                      <TrendingUp className="h-3 w-3 ml-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 ml-1" />
                    )}
                    {Math.abs(props.stats.trialToSubscribedRate.change).toFixed(
                      1,
                    )}
                    %
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                مقارنة بالفترة السابقة (30-60 يوم)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Danger Signs */}
      {props.atRiskStudents.length > 0 ? (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> طلاب غابوا
              بدون عذر
            </CardTitle>
            <Button onClick={() => setSendBulkMessages("at-risk")}>
              إرسال رسالة جماعية
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {props.atRiskStudents.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <span>
                    {s.name} – {s.reason}
                  </span>
                  {s.phone && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleWhatsApp(
                          s.phone,
                          `مرحباً ${s.name}، نود التواصل معك بخصوص حسابك.`,
                        )
                      }
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-300 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> طلاب معرضون
              للخطر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-primary">
              لا يوجد طلاب، الوضع اّمن
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Sheets */}
      <Tabs defaultValue="attendance">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">سجل الحضور اليوم</TabsTrigger>
          <TabsTrigger value="reconciliation">التسوية المالية</TabsTrigger>
          <TabsTrigger value="reports">التقارير المفقودة</TabsTrigger>
        </TabsList>

        {/* Attendance Sheet */}
        <TabsContent value="attendance">
          <div className="space-y-6">
            {/* 1. حصص بدون حضور */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">حصص بدون تسجيل حضور</CardTitle>
                {props.attendanceSheet.length > 0 && (
                  <Button
                    onClick={() => setSendBulkMessages("attendance-missing")}
                  >
                    إرسال رسالة جماعية
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {props.attendanceSheet.length === 0 ? (
                  <p className="text-muted-foreground">
                    لا توجد حصص بدون حضور اليوم
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {props.attendanceSheet.map((item) => (
                      <li
                        key={item.sessionId}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <span className="font-medium">
                            حصة المعلم{" "}
                            <span className="text-primary">
                              {item.tutorName}
                            </span>{" "}
                            مع الطالب{" "}
                            <span className="text-primary">
                              {item.studentName}
                            </span>
                          </span>
                          <span className="text-sm text-muted-foreground mr-2">
                            {formatTime(item.startTime)}
                          </span>
                        </div>
                        {item.tutorPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleWhatsApp(
                                item.tutorPhone,
                                `مرحباً، برجاء تسجيل حضور حصة اليوم مع الطالب ${item.studentName} الساعة ${formatTime(item.startTime)}.`,
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4 ml-2" /> تذكير
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 2. طلاب غائبون اليوم */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-destructive">
                  حصص اليوم التي غابها الطلاب
                </CardTitle>
                {props.absentSessions.length > 0 && (
                  <Button
                    onClick={() => setSendBulkMessages("attendance-absent")}
                  >
                    إرسال رسالة جماعية
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {props.absentSessions.length === 0 ? (
                  <p className="text-muted-foreground">لا يوجد غياب اليوم</p>
                ) : (
                  <ul className="space-y-2">
                    {props.absentSessions.map((item) => (
                      <li
                        key={item.sessionId}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {item.studentName}
                          </span>
                          <span className="text-sm text-muted-foreground mr-2">
                            غائب – حصة مع {item.tutorName} (
                            {formatTime(item.startTime)})
                          </span>
                        </div>
                        {item.studentPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleWhatsApp(
                                item.studentPhone,
                                `مرحباً ${item.studentName}، نود التواصل معك بخصوص غيابك اليوم.`,
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4 ml-2" /> تواصل
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reconciliation Sheet */}
        <TabsContent value="reconciliation">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-destructive">
                  مدفوعات متأخرة
                </CardTitle>
                <Button onClick={() => setSendBulkMessages("late-payment")}>
                  إرسال رسالة جماعية
                </Button>
              </CardHeader>
              <CardContent>
                {props.latePayments.length === 0 ? (
                  <p className="text-muted-foreground">
                    لا توجد مدفوعات متأخرة
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {props.latePayments.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <span className="font-medium">{p.studentName}</span>
                          <span className="text-sm text-muted-foreground mr-2">
                            {p.planTitle} – {p.amountDue} ر.س – متأخر{" "}
                            {p.daysOverdue} يوم
                          </span>
                        </div>
                        {p.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleWhatsApp(
                                p.phone,
                                `مرحباً، نود تذكيرك بدفع مستحقات الاشتراك.`,
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4 ml-2" /> تذكير
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-amber-600">
                  اشتراكات قاربت على الانتهاء
                </CardTitle>
                <Button onClick={() => setSendBulkMessages("near-end")}>
                  إرسال رسالة جماعية
                </Button>
              </CardHeader>
              <CardContent>
                {props.nearEndSubscriptions.length === 0 ? (
                  <p className="text-muted-foreground">
                    لا توجد اشتراكات قاربت على الانتهاء
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {props.nearEndSubscriptions.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <span className="font-medium">{s.studentName}</span>
                          <span className="text-sm text-muted-foreground mr-2">
                            {s.planTitle} – تنتهي {s.endDate} (متبقي{" "}
                            {s.daysLeft} يوم)
                          </span>
                        </div>
                        {s.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleWhatsApp(
                                s.phone,
                                `مرحباً، نود إعلامك بأن اشتراكك سينتهي قريباً.`,
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4 ml-2" /> تواصل
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Sheet */}
        <TabsContent value="reports">
          <div className="space-y-6">
            {/* 1. حصص بدون تقارير */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  حصص اليوم بدون تقارير
                </CardTitle>
                {props.reportsSheet.length > 0 && (
                  <Button
                    onClick={() => setSendBulkMessages("reports-missing")}
                  >
                    إرسال رسالة جماعية
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {props.reportsSheet.length === 0 ? (
                  <p className="text-muted-foreground">
                    جميع الحصص اليوم تحتوي على تقارير
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {props.reportsSheet.map((item) => (
                      <li
                        key={item.sessionId}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <span className="font-medium">{item.tutorName}</span>{" "}
                          <span className="text-sm text-muted-foreground mr-2">
                            مع {item.studentName} الساعة{" "}
                            {formatTime(item.startTime)}
                          </span>
                        </div>
                        {item.tutorPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleWhatsApp(
                                item.tutorPhone,
                                `مرحباً، نود تذكيرك بكتابة تقرير حصة ${item.studentName} اليوم.`,
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4 ml-2" /> تذكير
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 2. طلاب غائبون (لا يحتاجون تقرير) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  حصص اليوم التي غابها الطلاب
                </CardTitle>
                {props.absentSessions.length > 0 && (
                  <Button onClick={() => setSendBulkMessages("reports-absent")}>
                    إرسال رسالة جماعية
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {props.absentSessions.length === 0 ? (
                  <p className="text-muted-foreground">لا يوجد غياب اليوم</p>
                ) : (
                  <ul className="space-y-2">
                    {props.absentSessions.map((item) => (
                      <li
                        key={item.sessionId}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {item.studentName}
                          </span>
                          <span className="text-sm text-muted-foreground mr-2">
                            غائب – حصة مع {item.tutorName} (
                            {formatTime(item.startTime)})
                          </span>
                        </div>
                        {item.studentPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleWhatsApp(
                                item.studentPhone,
                                `مرحباً ${item.studentName}، نود التواصل معك بخصوص غيابك اليوم.`,
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4 ml-2" /> تواصل
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <SendBulkMessagesDialog
        open={!!sendBulkMessages}
        setOpen={() => setSendBulkMessages(null)}
        users={getBulkUsers()}
      />
    </div>
  );
}
