"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  MapPin,
  Clock,
  BookOpen,
  MoreHorizontal,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { StudentStatus } from "@/types/student";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import dayjs from "dayjs";

export const studentStatusMap: Record<number, StudentStatus> = {
  0: StudentStatus.trial,
  1: StudentStatus.subscribed,
  2: StudentStatus.lead,
  3: StudentStatus.churned,
  4: StudentStatus.paused,
};

export const studentStatusLabels: Record<StudentStatus, string> = {
  [StudentStatus.trial]: "تجربة",
  [StudentStatus.subscribed]: "مشترك",
  [StudentStatus.lead]: "عميل محتمل",
  [StudentStatus.churned]: "منسحب",
  [StudentStatus.paused]: "متوقف",
};

export const studentStatusColors: Record<StudentStatus, string> = {
  [StudentStatus.trial]:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  [StudentStatus.subscribed]: "bg-primary/10 text-primary",
  [StudentStatus.lead]:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  [StudentStatus.churned]: "bg-destructive/10 text-destructive",
  [StudentStatus.paused]: "bg-muted text-muted-foreground",
};

export const sessionStatusMap: Record<number, SessionStatus> = {
  0: SessionStatus.SCHEDULED,
  1: SessionStatus.COMPLETED,
  2: SessionStatus.CANCELLED,
  3: SessionStatus.RESCHEDULED,
};

export const sessionStatusLabels: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]: "مجدولة",
  [SessionStatus.COMPLETED]: "مكتملة",
  [SessionStatus.CANCELLED]: "ملغاة",
  [SessionStatus.RESCHEDULED]: "معاد جدولتها",
};

export const sessionStatusColors: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  [SessionStatus.COMPLETED]: "bg-primary/10 text-primary",
  [SessionStatus.CANCELLED]: "bg-destructive/10 text-destructive",
  [SessionStatus.RESCHEDULED]:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export const attendanceStatusMap: Record<number, AttendanceStatus> = {
  0: AttendanceStatus.ATTENDED,
  1: AttendanceStatus.ABSENT_EXCUSED,
  2: AttendanceStatus.ABSENT_UNEXCUSED,
  3: AttendanceStatus.LATE,
  4: AttendanceStatus.CANCELLED,
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.ATTENDED]: "حاضر",
  [AttendanceStatus.ABSENT_EXCUSED]: "غائب (بعذر)",
  [AttendanceStatus.ABSENT_UNEXCUSED]: "غائب (بدون عذر)",
  [AttendanceStatus.LATE]: "متأخر",
  [AttendanceStatus.CANCELLED]: "ملغى",
};

export const attendanceStatusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.ATTENDED]: "bg-primary/10 text-primary",
  [AttendanceStatus.ABSENT_EXCUSED]:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  [AttendanceStatus.ABSENT_UNEXCUSED]: "bg-destructive/10 text-destructive",
  [AttendanceStatus.LATE]:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  [AttendanceStatus.CANCELLED]: "bg-muted text-muted-foreground",
};

export const paymentStatusMap: Record<number, PaymentStatus> = {
  0: PaymentStatus.PENDING,
  1: PaymentStatus.PAID,
  2: PaymentStatus.FAILED,
  3: PaymentStatus.REFUNDED,
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "معلق",
  [PaymentStatus.PAID]: "مدفوع",
  [PaymentStatus.FAILED]: "فشل",
  [PaymentStatus.REFUNDED]: "مسترد",
};

export const paymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  [PaymentStatus.PAID]: "bg-primary/10 text-primary",
  [PaymentStatus.FAILED]: "bg-destructive/10 text-destructive",
  [PaymentStatus.REFUNDED]: "bg-muted text-muted-foreground",
};

export const paymentMethodMap: Record<number, PaymentMethod> = {
  0: PaymentMethod.CASH,
  1: PaymentMethod.CARD,
  2: PaymentMethod.BANK_TRANSFER,
  3: PaymentMethod.ONLINE,
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "نقدي",
  [PaymentMethod.CARD]: "بطاقة",
  [PaymentMethod.BANK_TRANSFER]: "تحويل بنكي",
  [PaymentMethod.ONLINE]: "إلكتروني",
};

export const dayLabels: Record<number, string> = {
  0: "الأحد",
  1: "الاثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

// ------------------------------------------------------------
// Interfaces based on your Prisma schema (adapted for the client)
// ------------------------------------------------------------
export interface Plan {
  id: number;
  title: string;
  sessionsPerWeek: number;
  price: number;
  billingPeriod: string;
}

export interface Availability {
  id: number;
  dayOfWeek: number;
  startTime: string; // HH:mm string (converted from DateTime)
  endTime: string;
}

export interface Note {
  id: number;
  content: string;
  authorName: string; // from author.name
  createdAt: string; // ISO string
}

export interface SessionRecord {
  id: number;
  startTime: string; // ISO string
  endTime: string;
  durationMinutes: number;
  status: number; // SessionStatus enum int
  topic: string | null;
  notes: string | null;
  studentId: number;
  studentName: string;
  tutorId: number;
  tutorName: string | null;
  attendance?: {
    id: number;
    status: number; // AttendanceStatus enum int
    reason: string | null;
  };
  recurringPatternId: number | null;
}

export interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: number; // PaymentStatus enum int
  method: number | null; // PaymentMethod enum int
  date: string; // ISO string
  dueDate: string | null;
  description: string | null;
  studentId: number;
  planId: number | null;
  invoiceUrl: string | null;
}

export interface StudentProfile {
  id: number;
  name: string;
  email: string | null;
  age: number;
  phone: string | null;
  country: string | null;
  timezone: string;
  status: number; // StudentStatus enum int
  startDate: string;
  renewalDate: string | null;
  source: string | null;
  currentProgram: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  preferredLanguage: string | null;
  profilePicture: string | null;
  tutorId: number | null;
  tutorName: string | null;
  planId: number | null;
  plan: Plan | null;
  availabilities: Availability[];
  notes: Note[];
  payments: Payment[];
  sessions: SessionRecord[];
}

// ==========================================
// Attendance Summary Component
// ==========================================
function AttendanceSummary({ sessions }: { sessions: SessionRecord[] }) {
  const completed = sessions.filter((s) => s.status === 1); // COMPLETED
  const total = completed.length;
  const attended = completed.filter((s) => s.attendance?.status === 0).length; // ATTENDED
  const late = completed.filter((s) => s.attendance?.status === 3).length; // LATE
  const absentExcused = completed.filter(
    (s) => s.attendance?.status === 1,
  ).length; // ABSENT_EXCUSED
  const absentUnexcused = completed.filter(
    (s) => s.attendance?.status === 2,
  ).length; // ABSENT_UNEXCUSED
  const rate = total > 0 ? Math.round(((attended + late) / total) * 100) : 0;

  const stats = [
    {
      label: "إجمالي الحصص",
      value: sessions.length,
      icon: BookOpen,
      color: "text-foreground",
    },
    {
      label: "حاضر",
      value: attended,
      icon: CheckCircle2,
      color: "text-primary",
    },
    { label: "متأخر", value: late, icon: Clock, color: "text-orange-500" },
    {
      label: "غائب (بعذر)",
      value: absentExcused,
      icon: AlertTriangle,
      color: "text-amber-500",
    },
    {
      label: "غائب (بدون عذر)",
      value: absentUnexcused,
      icon: XCircle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-primary">{rate}%</div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">نسبة الحضور</p>
          <Progress value={rate} className="h-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center p-3 rounded-lg bg-muted/50"
          >
            <s.icon className={`h-5 w-5 mb-1 ${s.color}`} />
            <span className="text-lg font-bold">{s.value}</span>
            <span className="text-xs text-muted-foreground text-center">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Main Client Component
// ==========================================
interface StudentProfileClientProps {
  student: StudentProfile;
  plans: Plan[];
}

export default function StudentProfileClient({
  student,
  plans,
}: StudentProfileClientProps) {
  const { toast } = useToast();
  const [loading] = useState(false);
  const now = useMemo(() => dayjs().unix(), []);
  const [activeTab, setActiveTab] = useState("overview");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [noteText, setNoteText] = useState("");
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  const statusKey =
    studentStatusMap[student.status] || studentStatusMap[StudentStatus.lead];
  const statusLabel = studentStatusLabels[statusKey];
  const statusColor = studentStatusColors[statusKey];

  const renewalWarning = useMemo(() => {
    if (!student.renewalDate) return false;
    const diff = new Date(student.renewalDate).getTime() - now;
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }, [student.renewalDate, now]);

  const filteredSessions = useMemo(() => {
    let s = [...student.sessions];
    if (sessionFilter !== "all")
      s = s.filter((x) => x.status === parseInt(sessionFilter));
    if (sessionSearch) {
      const q = sessionSearch.toLowerCase();
      s = s.filter(
        (x) =>
          x.topic?.toLowerCase().includes(q) ||
          x.tutorName?.toLowerCase().includes(q),
      );
    }
    return s.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [student.sessions, sessionFilter, sessionSearch]);

  const upcomingSessions = student.sessions
    .filter((s) => new Date(s.startTime) > new Date() && s.status === 0) // SCHEDULED
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
    .slice(0, 3);

  const recentSessions = student.sessions
    .filter((s) => new Date(s.startTime) <= new Date())
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
    .slice(0, 3);

  const pendingPayments = student.payments.filter((p) => p.status === 0); // PENDING
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Back button */}
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        العودة للطلاب
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{student.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{student.age} سنة</span>
                    {student.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {student.country}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {student.timezone}
                    </span>
                  </div>
                </div>
                <Badge className={statusColor}>{statusLabel}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {student.tutorName && (
                  <div>
                    <span className="text-muted-foreground">المعلم: </span>
                    <Link
                      href={`/dashboard/tutors/${student.tutorId}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {student.tutorName}
                    </Link>
                  </div>
                )}
                {student.plan && (
                  <div>
                    <span className="text-muted-foreground">الخطة: </span>
                    <span className="font-medium">{student.plan.title}</span>
                  </div>
                )}
                {student.renewalDate && (
                  <div
                    className={
                      renewalWarning ? "text-amber-600 font-medium" : ""
                    }
                  >
                    {renewalWarning && (
                      <AlertTriangle className="h-3.5 w-3.5 inline ml-1" />
                    )}
                    <span className="text-muted-foreground">التجديد: </span>
                    {formatDate(student.renewalDate)}
                  </div>
                )}
              </div>
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {student.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://wa.me/${student.phone.replace("+", "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageSquare className="h-4 w-4" /> واتساب
                    </a>
                  </Button>
                )}
                {student.email && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${student.email}`}>
                      <Mail className="h-4 w-4" /> بريد إلكتروني
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast({ title: "فتح نموذج التعديل" })}
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
            { val: "sessions", label: "الحصص" },
            { val: "attendance", label: "الحضور والتقدم" },
            { val: "billing", label: "المالية والخطة" },
            { val: "communication", label: "التواصل" },
            { val: "settings", label: "الملف الشخصي" },
          ].map((t) => (
            <TabsTrigger
              key={t.val}
              value={t.val}
              className="flex-1 min-w-[100px] text-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ===== Overview Tab ===== */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملخص الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceSummary sessions={student.sessions} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الحصص القادمة</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد حصص قادمة
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((s) => {
                      const sessionStatusKey = sessionStatusMap[s.status];
                      const sessionStatusLabel =
                        sessionStatusLabels[sessionStatusKey];
                      const sessionStatusColor =
                        sessionStatusColors[sessionStatusKey];
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {s.topic || "بدون موضوع"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(s.startTime)} •{" "}
                              {formatTime(s.startTime)} -{" "}
                              {formatTime(s.endTime)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              مع {s.tutorName}
                            </p>
                          </div>
                          <Badge className={sessionStatusColor}>
                            {sessionStatusLabel}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">آخر الحصص</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد حصص سابقة
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((s) => {
                      const sessionStatusKey = sessionStatusMap[s.status];
                      const sessionStatusLabel =
                        sessionStatusLabels[sessionStatusKey];
                      const sessionStatusColor =
                        sessionStatusColors[sessionStatusKey];
                      let attendanceBadge = null;
                      if (s.attendance) {
                        const attKey = attendanceStatusMap[s.attendance.status];
                        attendanceBadge = (
                          <Badge className={attendanceStatusColors[attKey]}>
                            {attendanceStatusLabels[attKey]}
                          </Badge>
                        );
                      }
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {s.topic || "بدون موضوع"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(s.startTime)} •{" "}
                              {formatTime(s.startTime)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={sessionStatusColor}>
                              {sessionStatusLabel}
                            </Badge>
                            {attendanceBadge}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Latest Note */}
          {student.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">آخر ملاحظة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm">{student.notes[0].content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {student.notes[0].authorName} •{" "}
                    {formatDate(student.notes[0].createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== Sessions Tab ===== */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <Input
                placeholder="بحث بالموضوع أو المعلم..."
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
                  <SelectItem value="0">مجدولة</SelectItem>
                  <SelectItem value="1">مكتملة</SelectItem>
                  <SelectItem value="2">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => toast({ title: "فتح نموذج إضافة حصة" })}>
              <Plus className="h-4 w-4" /> إضافة حصة
            </Button>
          </div>

          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد حصص تطابق البحث</p>
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
                      <TableHead>المعلم</TableHead>
                      <TableHead>الموضوع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الحضور</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((s) => {
                      const sessionStatusKey = sessionStatusMap[s.status];
                      const sessionStatusLabel =
                        sessionStatusLabels[sessionStatusKey];
                      const sessionStatusColor =
                        sessionStatusColors[sessionStatusKey];
                      let attendanceCell;
                      if (s.attendance) {
                        const attKey = attendanceStatusMap[s.attendance.status];
                        attendanceCell = (
                          <Badge className={attendanceStatusColors[attKey]}>
                            {attendanceStatusLabels[attKey]}
                          </Badge>
                        );
                      } else if (
                        s.status === 1 ||
                        new Date(s.startTime) < new Date()
                      ) {
                        // Completed or past but no attendance – show dropdown
                        attendanceCell = (
                          <Select
                            onValueChange={(v) =>
                              toast({
                                title: `تم تسجيل الحضور: ${attendanceStatusLabels[attendanceStatusMap[parseInt(v)]]}`,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
                              <SelectValue placeholder="تسجيل" />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 1, 2, 3].map((val) => {
                                const attKey = attendanceStatusMap[val];
                                return (
                                  <SelectItem key={val} value={val.toString()}>
                                    {attendanceStatusLabels[attKey]}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        );
                      } else {
                        attendanceCell = "—";
                      }
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(s.startTime)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatTime(s.startTime)} – {formatTime(s.endTime)}
                          </TableCell>
                          <TableCell>{s.tutorName}</TableCell>
                          <TableCell>{s.topic || "—"}</TableCell>
                          <TableCell>
                            <Badge className={sessionStatusColor}>
                              {sessionStatusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>{attendanceCell}</TableCell>
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
                                  onClick={() =>
                                    toast({ title: "عرض التفاصيل" })
                                  }
                                >
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast({ title: "تعديل الحصة" })
                                  }
                                >
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast({ title: "إعادة جدولة" })
                                  }
                                >
                                  إعادة جدولة
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => toast({ title: "حذف الحصة" })}
                                >
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ===== Attendance & Progress Tab ===== */}
        <TabsContent value="attendance" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملخص الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceSummary sessions={student.sessions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">سجل الحضور التفصيلي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الموضوع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>السبب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.sessions
                      .filter((s) => s.attendance)
                      .map((s) => {
                        const attKey =
                          attendanceStatusMap[s.attendance!.status];
                        return (
                          <TableRow key={s.id}>
                            <TableCell>{formatDate(s.startTime)}</TableCell>
                            <TableCell>{s.topic || "—"}</TableCell>
                            <TableCell>
                              <Badge className={attendanceStatusColors[attKey]}>
                                {attendanceStatusLabels[attKey]}
                              </Badge>
                            </TableCell>
                            <TableCell>{s.attendance?.reason || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تقدم المنهج</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { topic: "سورة البقرة - الآيات 1-40", done: true },
                  { topic: "مراجعة سورة البقرة", done: true },
                  { topic: "أحكام التجويد - الإدغام", done: true },
                  { topic: "سورة البقرة - الآيات 41-80", done: false },
                  { topic: "أحكام التجويد - الإخفاء", done: false },
                ].map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center ${t.done ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"}`}
                    >
                      {t.done && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <span
                      className={
                        t.done
                          ? "line-through text-muted-foreground"
                          : "font-medium"
                      }
                    >
                      {t.topic}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Billing Tab ===== */}
        <TabsContent value="billing" className="space-y-6 mt-4">
          {/* Current Plan */}
          {student.plan && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">الخطة الحالية</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChangePlanOpen(true)}
                >
                  تغيير الخطة
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">الخطة</p>
                    <p className="font-bold text-lg">{student.plan.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">حصص/أسبوع</p>
                    <p className="font-bold text-lg">
                      {student.plan.sessionsPerWeek}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">السعر</p>
                    <p className="font-bold text-lg">
                      {student.plan.price} ر.س
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الفترة</p>
                    <p className="font-bold text-lg">
                      {student.plan.billingPeriod === "monthly"
                        ? "شهري"
                        : "سنوي"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Outstanding */}
          {totalPending > 0 && (
            <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-900/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      مبلغ مستحق
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {totalPending} ر.س بانتظار الدفع
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setRecordPaymentOpen(true)}>
                  تسجيل دفعة
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">سجل المدفوعات</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecordPaymentOpen(true)}
              >
                <Plus className="h-4 w-4" /> تسجيل دفعة
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
                      <TableHead>الطريقة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>فاتورة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.payments.map((p) => {
                      const paymentStatusKey = paymentStatusMap[p.status];
                      const paymentStatusLabel =
                        paymentStatusLabels[paymentStatusKey];
                      const paymentStatusColor =
                        paymentStatusColors[paymentStatusKey];
                      const paymentMethodKey =
                        p.method !== null ? paymentMethodMap[p.method] : null;
                      const paymentMethodLabel = paymentMethodKey
                        ? paymentMethodLabels[paymentMethodKey]
                        : "—";
                      return (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.date)}</TableCell>
                          <TableCell>{p.description || "—"}</TableCell>
                          <TableCell className="font-medium">
                            {p.amount} {p.currency}
                          </TableCell>
                          <TableCell>{paymentMethodLabel}</TableCell>
                          <TableCell>
                            <Badge className={paymentStatusColor}>
                              {paymentStatusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {p.invoiceUrl ? (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={p.invoiceUrl}>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Communication Tab ===== */}
        <TabsContent value="communication" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إرسال رسالة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب رسالتك هنا..."
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button onClick={() => toast({ title: "تم إرسال عبر واتساب" })}>
                  <MessageSquare className="h-4 w-4" /> إرسال واتساب
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast({ title: "تم إرسال عبر البريد" })}
                >
                  <Mail className="h-4 w-4" /> إرسال بريد
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
                      toast({ title: "تمت إضافة الملاحظة" });
                      setNoteText("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" /> إضافة
                </Button>
              </div>
              <div className="space-y-3">
                {student.notes.map((n) => (
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
                        onClick={() => toast({ title: "حذف الملاحظة" })}
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

        {/* ===== Settings Tab ===== */}
        <TabsContent value="settings" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>الاسم</Label>
                <Input defaultValue={student.name} />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input defaultValue={student.email || ""} type="email" />
              </div>
              <div>
                <Label>الهاتف</Label>
                <Input defaultValue={student.phone || ""} />
              </div>
              <div>
                <Label>العمر</Label>
                <Input defaultValue={String(student.age)} type="number" />
              </div>
              <div>
                <Label>الدولة</Label>
                <Input defaultValue={student.country || ""} />
              </div>
              <div>
                <Label>المنطقة الزمنية</Label>
                <Input defaultValue={student.timezone} />
              </div>
              <div>
                <Label>اللغة المفضلة</Label>
                <Input defaultValue={student.preferredLanguage || ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">جهة اتصال الطوارئ</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>الاسم</Label>
                <Input defaultValue={student.emergencyContactName || ""} />
              </div>
              <div>
                <Label>الهاتف</Label>
                <Input defaultValue={student.emergencyContactPhone || ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الأكاديمية</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>المصدر</Label>
                <Input defaultValue={student.source || ""} />
              </div>
              <div>
                <Label>البرنامج الحالي</Label>
                <Input defaultValue={student.currentProgram || ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">أوقات التفضيل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {student.availabilities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <span className="font-medium">
                      {dayLabels[a.dayOfWeek]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {a.startTime} – {a.endTime}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toast({ title: "حذف" })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast({ title: "إضافة وقت جديد" })}
                >
                  <Plus className="h-4 w-4" /> إضافة وقت
                </Button>
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

      {/* Change Plan Dialog */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير الخطة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-lg border cursor-pointer hover:border-primary transition-colors ${student.planId === p.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => {
                  toast({ title: `تم تغيير الخطة إلى ${p.title}` });
                  setChangePlanOpen(false);
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.sessionsPerWeek} حصص/أسبوع
                    </p>
                  </div>
                  <p className="font-bold text-lg">{p.price} ر.س</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المبلغ</Label>
              <Input type="number" placeholder="0" />
            </div>
            <div>
              <Label>طريقة الدفع</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3].map((val) => {
                    const methodKey = paymentMethodMap[val];
                    return (
                      <SelectItem key={val} value={val.toString()}>
                        {paymentMethodLabels[methodKey]}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الوصف</Label>
              <Input placeholder="وصف الدفعة" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordPaymentOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                toast({ title: "تم تسجيل الدفعة" });
                setRecordPaymentOpen(false);
              }}
            >
              تسجيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
