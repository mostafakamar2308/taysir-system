"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, AlertTriangle } from "lucide-react";
import dayjs from "@/lib/dayjs";

interface DashboardClientProps {
  stats: {
    totalStudents: number;
    subscribedStudents: number;
    trialStudents: number;
    leadStudents: number;
    newStudentsThisWeek: number;
    activeTutors: number;
    totalSupervisors: number;
    revenueThisMonth: number;
    revenuePrevMonth: number;
    ltv: number;
    cac: number;
    leadToTrialRate: number;
    trialToSubscribedRate: number;
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
    startTime: string;
  }>;
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

export default function DashboardClient(props: DashboardClientProps) {
  const [quickActionState, setQuickActionState] = useState({
    addStudent: false,
    addTutor: false,
    addSession: false,
    addExpense: false,
  });

  const formatTime = (iso: string) => dayjs(iso).format("h:mm A");

  const handleWhatsApp = (phone: string | null, text?: string) => {
    if (!phone) return;
    const url = `https://wa.me/${phone.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
    window.open(url, "_blank");
  };

  const openDialog = (key: keyof typeof quickActionState) => {
    setQuickActionState((prev) => ({ ...prev, [key]: true }));
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
          <Button size="sm" onClick={() => openDialog("addStudent")}>
            <Plus className="h-4 w-4 ml-2" /> إضافة طالب
          </Button>
          <Button size="sm" onClick={() => openDialog("addTutor")}>
            <Plus className="h-4 w-4 ml-2" /> إضافة معلم
          </Button>
          <Button size="sm" onClick={() => openDialog("addSession")}>
            <Plus className="h-4 w-4 ml-2" /> إضافة حصة
          </Button>
          <Button size="sm" onClick={() => openDialog("addExpense")}>
            <Plus className="h-4 w-4 ml-2" /> تسجيل مصروف
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الطلاب" value={props.stats.totalStudents} />
        <StatCard label="المشتركين" value={props.stats.subscribedStudents} />
        <StatCard label="تجريبي" value={props.stats.trialStudents} />
        <StatCard label="عملاء محتملين" value={props.stats.leadStudents} />
        <StatCard
          label="جدد هذا الأسبوع"
          value={props.stats.newStudentsThisWeek}
        />
        <StatCard label="معلمين نشطين" value={props.stats.activeTutors} />
        <StatCard label="مشرفين" value={props.stats.totalSupervisors} />
        <StatCard
          label="إيرادات هذا الشهر"
          value={`${props.stats.revenueThisMonth} ر.س`}
        />
      </div>

      {/* Conversion Rates & Financial Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">تحويل Lead → Trial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {props.stats.leadToTrialRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">تحويل Trial → مشترك</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {props.stats.trialToSubscribedRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">LTV / CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {props.stats.ltv.toFixed(0)} / {props.stats.cac.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">
              القيمة الدائمة للعميل / تكلفة اكتساب العميل
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Danger Signs */}
      {props.atRiskStudents.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> طلاب معرضون
              للخطر
            </CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                حصص اليوم بدون تسجيل حضور
              </CardTitle>
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
                        <span className="font-medium">{item.studentName}</span>
                        <span className="text-sm text-muted-foreground mr-2">
                          {formatTime(item.startTime)}
                        </span>
                      </div>
                      {item.studentPhone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleWhatsApp(
                              item.studentPhone,
                              `مرحباً، نذكرك بحصة اليوم في ${formatTime(item.startTime)}.`,
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
        </TabsContent>

        {/* Reconciliation Sheet */}
        <TabsContent value="reconciliation">
          <div className="space-y-6">
            {/* Late Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-destructive">
                  مدفوعات متأخرة
                </CardTitle>
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

            {/* Near-end Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-amber-600">
                  اشتراكات قاربت على الانتهاء
                </CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">حصص اليوم بدون تقارير</CardTitle>
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
                        <span className="font-medium">{item.tutorName}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple stat card component
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
