"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Mail,
  Edit,
  Calendar,
  Clock,
  BookOpen,
  MoreHorizontal,
  Plus,
  Users,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { TutorProfile } from "@/types/tutor";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { PaymentStatus } from "@/types/payment";
import {
  attendanceStatusColors,
  attendanceStatusLabels,
  sessionStatusColors,
  sessionStatusLabels,
} from "@/const/sessions";
import {
  dayLabels,
  paymentStatusColors,
  paymentStatusLabels,
  studentStatusColors,
  studentStatusLabels,
} from "../studentProfile/viewer";

interface TutorProfileClientProps {
  tutor: TutorProfile;
}

export default function TutorProfileClient({ tutor }: TutorProfileClientProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [noteText, setNoteText] = useState("");
  const [addAvailOpen, setAddAvailOpen] = useState(false);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Attendance stats
  const completedSessions = tutor.sessions.filter(
    (s) => s.status === SessionStatus.COMPLETED,
  );
  const attendedCount = completedSessions.filter(
    (s) =>
      s.attendance?.status === AttendanceStatus.ATTENDED ||
      s.attendance?.status === AttendanceStatus.LATE,
  ).length;
  const attendanceRate =
    completedSessions.length > 0
      ? Math.round((attendedCount / completedSessions.length) * 100)
      : 0;

  const todaySessions = tutor.sessions.filter((s) => {
    const d = new Date(s.startTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const upcomingThisWeek = tutor.sessions.filter((s) => {
    const d = new Date(s.startTime);
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return d > now && d <= weekEnd && s.status === SessionStatus.SCHEDULED;
  });

  const filteredSessions = useMemo(() => {
    let s = [...tutor.sessions];
    if (sessionFilter !== "all")
      s = s.filter((x) => x.status === parseInt(sessionFilter));
    if (sessionSearch) {
      const q = sessionSearch.toLowerCase();
      s = s.filter(
        (x) =>
          x.topic?.toLowerCase().includes(q) ||
          x.studentName.toLowerCase().includes(q),
      );
    }
    return s.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [tutor.sessions, sessionFilter, sessionSearch]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return tutor.students;
    return tutor.students.filter((s) => s.name.includes(studentSearch));
  }, [tutor.students, studentSearch]);

  // Earnings
  const paidPayments = tutor.payments.filter(
    (p) => p.status === PaymentStatus.PAID,
  );
  const totalEarned = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = tutor.payments.filter(
    (p) => p.status === PaymentStatus.PENDING,
  );
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
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
                  <span className="font-bold">{tutor.pricePerSession} ر.س</span>
                </div>
                <div>
                  <span className="text-muted-foreground">الطلاب: </span>
                  <span className="font-bold">
                    {tutor.students.length}
                    {tutor.maxStudents ? ` / ${tutor.maxStudents}` : ""}
                  </span>
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
                  onClick={() => toast({ title: "تعديل المعلم" })}
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
            { val: "availability", label: "الأوقات المتاحة" },
            { val: "payments", label: "المالية" },
            { val: "communication", label: "التواصل" },
            { val: "profile", label: "الملف الشخصي" },
          ].map((t) => (
            <TabsTrigger
              key={t.val}
              value={t.val}
              className="flex-1 min-w-[90px] text-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "إجمالي الطلاب",
                value: tutor.students.length,
                icon: Users,
                color: "text-primary",
              },
              {
                label: "حصص هذا الأسبوع",
                value: upcomingThisWeek.length,
                icon: Calendar,
                color: "text-blue-500",
              },
              {
                label: "نسبة الحضور",
                value: `${attendanceRate}%`,
                icon: CheckCircle2,
                color: "text-primary",
              },
              {
                label: "إجمالي الحصص",
                value: tutor.sessions.length,
                icon: BookOpen,
                color: "text-muted-foreground",
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <s.icon className={`h-6 w-6 mb-2 ${s.color}`} />
                  <span className="text-2xl font-bold">{s.value}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Today's Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">حصص اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد حصص لهذا اليوم
                </p>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">{s.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(s.startTime)} – {formatTime(s.endTime)} •{" "}
                          {s.topic || "بدون موضوع"}
                        </p>
                      </div>
                      <Badge className={sessionStatusColors[s.status]}>
                        {sessionStatusLabels[s.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Note */}
          {tutor.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">آخر ملاحظة من الإدارة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm">{tutor.notes[0].content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {tutor.notes[0].authorName} •{" "}
                    {formatDate(tutor.notes[0].createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <Input
              placeholder="بحث عن طالب..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-60"
            />
            <Button
              variant="outline"
              onClick={() => toast({ title: "إرسال رسالة جماعية" })}
            >
              <MessageSquare className="h-4 w-4" /> رسالة للجميع
            </Button>
          </div>
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا يوجد طلاب</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>العمر</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الخطة</TableHead>
                      <TableHead>الحصة القادمة</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/students/${s.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {s.name}
                          </Link>
                        </TableCell>
                        <TableCell>{s.age}</TableCell>
                        <TableCell>
                          <Badge className={studentStatusColors[s.status]}>
                            {studentStatusLabels[s.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{s.planTitle || "—"}</TableCell>
                        <TableCell>
                          {s.nextSessionDate
                            ? formatDate(s.nextSessionDate)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a
                                href={`https://wa.me/`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link href={`/dashboard/students/${s.id}`}>
                                <Users className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <Input
                placeholder="بحث بالموضوع أو الطالب..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="w-60"
              />
              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="SCHEDULED">مجدولة</SelectItem>
                  <SelectItem value="COMPLETED">مكتملة</SelectItem>
                  <SelectItem value="CANCELLED">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => toast({ title: "إضافة حصة" })}>
              <Plus className="h-4 w-4" /> إضافة حصة
            </Button>
          </div>

          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد حصص</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>الطالب</TableHead>
                      <TableHead>الموضوع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الحضور</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(s.startTime)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/students/${s.studentId}`}
                            className="text-primary hover:underline"
                          >
                            {s.studentName}
                          </Link>
                        </TableCell>
                        <TableCell>{s.topic || "—"}</TableCell>
                        <TableCell>
                          <Badge className={sessionStatusColors[s.status]}>
                            {sessionStatusLabels[s.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.attendance ? (
                            <Badge
                              className={
                                attendanceStatusColors[s.attendance.status]
                              }
                            >
                              {attendanceStatusLabels[s.attendance.status]}
                            </Badge>
                          ) : new Date(s.startTime) < new Date() ? (
                            <Select
                              onValueChange={(v) =>
                                toast({
                                  title: `تم تسجيل: ${attendanceStatusLabels[Number(v) as AttendanceStatus]}`,
                                })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-28">
                                <SelectValue placeholder="تسجيل" />
                              </SelectTrigger>
                              <SelectContent>
                                {(
                                  [
                                    AttendanceStatus.ATTENDED,
                                    AttendanceStatus.LATE,
                                    AttendanceStatus.ABSENT_EXCUSED,
                                    AttendanceStatus.ABSENT_UNEXCUSED,
                                  ] as const
                                ).map((a) => (
                                  <SelectItem key={a} value={String(a)}>
                                    {attendanceStatusLabels[a]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => toast({ title: "عرض التفاصيل" })}
                              >
                                عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toast({ title: "تعديل" })}
                              >
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => toast({ title: "حذف" })}
                              >
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                الأوقات المتاحة الأسبوعية
              </CardTitle>
              <Button size="sm" onClick={() => setAddAvailOpen(true)}>
                <Plus className="h-4 w-4" /> إضافة وقت
              </Button>
            </CardHeader>
            <CardContent>
              {tutor.availabilities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لم يتم تحديد أوقات متاحة
                </p>
              ) : (
                <div className="space-y-2">
                  {tutor.availabilities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {dayLabels[a.dayOfWeek]}
                        </Badge>
                        <span className="text-sm">
                          {a.startTime} – {a.endTime}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toast({ title: "تعديل" })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toast({ title: "حذف" })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                حظر تواريخ محددة (إجازات)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد تواريخ محظورة
              </p>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => toast({ title: "إضافة تاريخ محظور" })}
              >
                <Plus className="h-4 w-4" /> إضافة تاريخ
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                <p className="text-2xl font-bold text-primary">
                  {totalEarned} ر.س
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">مبالغ معلقة</p>
                <p className="text-2xl font-bold text-amber-600">
                  {totalPending} ر.س
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">متوسط الحصة</p>
                <p className="text-2xl font-bold">
                  {tutor.pricePerSession} ر.س
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">سجل المدفوعات</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ title: "تصدير التقرير" })}
              >
                تصدير
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tutor.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.date)}</TableCell>
                        <TableCell>{p.description || "—"}</TableCell>
                        <TableCell className="font-medium">
                          {p.amount} {p.currency}
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentStatusColors[p.status]}>
                            {paymentStatusLabels[p.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.status === PaymentStatus.PENDING && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toast({ title: "تم تسجيل الدفع" })}
                            >
                              تسجيل دفع
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">رسالة جماعية للطلاب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب رسالتك لجميع طلاب هذا المعلم..."
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => toast({ title: "تم الإرسال عبر واتساب" })}
                >
                  <MessageSquare className="h-4 w-4" /> واتساب جماعي
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast({ title: "تم الإرسال عبر البريد" })}
                >
                  <Mail className="h-4 w-4" /> بريد جماعي
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الملاحظات الداخلية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="أضف ملاحظة..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (noteText.trim()) {
                      toast({ title: "تمت الإضافة" });
                      setNoteText("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" /> إضافة
                </Button>
              </div>
              <div className="space-y-3">
                {tutor.notes.map((n) => (
                  <div key={n.id} className="p-4 rounded-lg border bg-card">
                    <p className="text-sm">{n.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {n.authorName} • {formatDate(n.createdAt)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toast({ title: "حذف" })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile / Settings Tab */}
        <TabsContent value="profile" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>الاسم</Label>
                <Input defaultValue={tutor.name} />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input defaultValue={tutor.email} type="email" />
              </div>
              <div>
                <Label>الهاتف</Label>
                <Input defaultValue={tutor.phone || ""} />
              </div>
              <div>
                <Label>المنطقة الزمنية</Label>
                <Input defaultValue={tutor.timezone} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المعلومات المهنية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>سعر الحصة (ر.س)</Label>
                  <Input
                    defaultValue={String(tutor.pricePerSession)}
                    type="number"
                  />
                </div>
                <div>
                  <Label>الحد الأقصى للطلاب</Label>
                  <Input
                    defaultValue={String(tutor.maxStudents || "")}
                    type="number"
                  />
                </div>
              </div>
              <div>
                <Label>النبذة التعريفية</Label>
                <Textarea
                  defaultValue={tutor.bio || ""}
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>المؤهلات</Label>
                <Textarea
                  defaultValue={tutor.qualifications || ""}
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>التخصصات</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tutor.specialities.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s}{" "}
                      <XCircle
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toast({ title: "إزالة" })}
                      />
                    </Badge>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast({ title: "إضافة تخصص" })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label>حالة النشاط</Label>
                <Switch
                  defaultChecked={tutor.active}
                  onCheckedChange={() => toast({ title: "تم التبديل" })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => toast({ title: "تم حفظ التغييرات" })}>
              حفظ التغييرات
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Availability Dialog */}
      <Dialog open={addAvailOpen} onOpenChange={setAddAvailOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة وقت متاح</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اليوم</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر اليوم" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dayLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>من</Label>
                <Input type="time" />
              </div>
              <div>
                <Label>إلى</Label>
                <Input type="time" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAvailOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                toast({ title: "تمت الإضافة" });
                setAddAvailOpen(false);
              }}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
