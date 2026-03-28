"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, GraduationCap, Eye } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type {
  MonthlyData,
  TutorAttendanceData,
  RevenueExpenseData,
} from "@/types/analytics";

interface TopStudent {
  studentId: number;
  studentName: string;
  attendanceRate: number;
}

interface AnalyticsClientProps {
  studentGrowth: MonthlyData[];
  revenueExpense: RevenueExpenseData[];
  tutorAttendance: TutorAttendanceData[];
  topStudents: TopStudent[];
}

export default function AnalyticsClient({
  studentGrowth,
  revenueExpense,
  tutorAttendance,
  topStudents,
}: AnalyticsClientProps) {
  const router = useRouter();

  // Compute summary stats
  const totalActiveStudents =
    studentGrowth.length > 0
      ? studentGrowth[studentGrowth.length - 1].value
      : 0;

  const topTutor = tutorAttendance[0]?.tutorName ?? "—";
  const topTutorRate = tutorAttendance[0]?.attendanceRate ?? 0;

  const summaryCards = [
    {
      title: "إجمالي الطلاب النشطين",
      value: totalActiveStudents.toString(),
      icon: Users,
      color: "text-primary",
    },
    {
      title: "المعلمون الأعلى حضوراً",
      value: topTutor,
      subtitle: `${topTutorRate}%`,
      icon: GraduationCap,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحليلات</h1>
        <p className="text-muted-foreground mt-1">
          رؤى تفصيلية حول أداء الأكاديمية
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نمو الطلاب (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={studentGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ direction: "rtl" }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="طلاب جدد"
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">نسبة الحضور حسب المعلم</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tutorAttendance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey="tutorName"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip contentStyle={{ direction: "rtl" }} />
                <Bar
                  dataKey="attendanceRate"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  name="نسبة الحضور %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              الإيرادات مقابل المصروفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ direction: "rtl" }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="الإيرادات"
                  dot={{ r: 4, fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="المصروفات"
                  dot={{ r: 4, fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tutor Attendance with Analytics Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أداء المعلمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المعلم</TableHead>
                    <TableHead className="text-right">نسبة الحضور</TableHead>
                    <TableHead className="text-right">إجمالي الحصص</TableHead>
                    <TableHead className="text-right w-20">التحليلات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorAttendance.map((tutor) => (
                    <TableRow key={tutor.tutorId}>
                      <TableCell className="font-medium">
                        {tutor.tutorName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tutor.attendanceRate >= 85 ? "default" : "secondary"
                          }
                          className={
                            tutor.attendanceRate >= 85
                              ? "bg-primary/10 text-primary"
                              : ""
                          }
                        >
                          {tutor.attendanceRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>{tutor.totalSessions}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            router.push(
                              `/dashboard/analytics/tutors/${tutor.tutorId}`,
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        {/* Top Students Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أفضل الطلاب حضوراً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الطالب</TableHead>
                    <TableHead className="text-right">نسبة الحضور</TableHead>
                    <TableHead className="text-right w-20">التحليلات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">
                        {student.studentName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            student.attendanceRate >= 85
                              ? "bg-primary/10 text-primary"
                              : "bg-amber-100 text-amber-700"
                          }
                        >
                          {student.attendanceRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            router.push(
                              `/dashboard/analytics/students/${student.studentId}`,
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
