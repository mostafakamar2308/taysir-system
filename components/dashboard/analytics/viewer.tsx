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
import { Users, TrendingUp, GraduationCap, Award, Eye } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  StudentProgressData,
  ProgramCompletionData,
  RevenueExpenseData,
} from "@/types/analytics";

interface AnalyticsClientProps {
  studentGrowth: MonthlyData[];
  revenueExpense: RevenueExpenseData[];
  tutorAttendance: TutorAttendanceData[];
  programCompletion: ProgramCompletionData[];
  studentProgress: StudentProgressData[];
}

export default function AnalyticsClient({
  studentGrowth,
  revenueExpense,
  tutorAttendance,
  programCompletion,
  studentProgress,
}: AnalyticsClientProps) {
  const router = useRouter();

  // Compute summary stats
  const totalActiveStudents =
    studentGrowth.length > 0
      ? studentGrowth[studentGrowth.length - 1].value
      : 0;
  const avgAttendance =
    studentProgress.reduce((sum, s) => sum + s.attendanceRate, 0) /
    (studentProgress.length || 1);
  const advancedStudents = studentProgress.filter(
    (s) => (s.completedTopics / s.totalTopics) * 100 >= 80,
  ).length;
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
      title: "متوسط نسبة الحضور",
      value: `${Math.round(avgAttendance)}%`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "الطلاب المتقدمون",
      value: advancedStudents.toString(),
      subtitle: "> 80% في برنامجهم",
      icon: Award,
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ direction: "rtl" }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="طلاب جدد"
                  dot={{ fill: "hsl(var(--primary))" }}
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
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
                  fill="hsl(var(--primary))"
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ direction: "rtl" }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="الإيرادات"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  name="المصروفات"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">معدل إكمال البرامج</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={programCompletion}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent || 5) * 100).toFixed(0)}%`
                  }
                >
                  {programCompletion.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ direction: "rtl" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Table with Analytics Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تقدم الطلاب في البرامج</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الطالب</TableHead>
                  <TableHead className="text-right">البرنامج</TableHead>
                  <TableHead className="text-right">التقدم</TableHead>
                  <TableHead className="text-right">نسبة الحضور</TableHead>
                  <TableHead className="text-right w-20">التحليلات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentProgress.map((student) => {
                  const progress =
                    Math.round(
                      (student.completedTopics / student.totalTopics) * 100,
                    ) || 0;
                  return (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">
                        {student.studentName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.programName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-30">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {student.completedTopics}/{student.totalTopics}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.attendanceRate >= 85
                              ? "default"
                              : "secondary"
                          }
                          className={
                            student.attendanceRate >= 85
                              ? "bg-primary/10 text-primary"
                              : ""
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
    </div>
  );
}
