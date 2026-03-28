"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TutorAnalyticsClientProps {
  tutorName: string;
  specialities: string[];
  studentCount: number;
  totalSessions: number;
  avgAttendance: number;
  totalSalary: number;
  sessionsTaught: { month: string; label: string; value: number }[];
  attendanceBreakdown: { name: string; value: number; fill: string }[];
  topStudents: {
    studentId: number;
    studentName: string;
    attendanceRate: number;
    programName: string;
  }[];
}

export default function TutorAnalyticsClient({
  tutorName,
  specialities,
  studentCount,
  totalSessions,
  avgAttendance,
  totalSalary,
  sessionsTaught,
  attendanceBreakdown,
  topStudents,
}: TutorAnalyticsClientProps) {
  const router = useRouter();

  const summaryCards = [
    { title: "عدد الطلاب", value: studentCount.toString(), icon: Users },
    {
      title: "إجمالي الحصص الأسبوعية",
      value: totalSessions.toString(),
      icon: Calendar,
    },
    {
      title: "متوسط حضور الطلاب",
      value: `${avgAttendance}%`,
      icon: TrendingUp,
    },
    {
      title: "إجمالي الرواتب",
      value: `${totalSalary.toLocaleString("ar-EG")} ج.م`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/analytics")}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <span className="text-muted-foreground text-sm">التحليلات</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
          {tutorName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{tutorName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              نشط
            </Badge>
            <span className="text-sm text-muted-foreground">
              {specialities.join("، ")}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-lg font-bold mt-0.5">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الحصص المُدرّسة شهرياً</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sessionsTaught}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ direction: "rtl" }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="عدد الحصص"
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع حالات الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attendanceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent || 5) * 100).toFixed(0)}%`
                  }
                >
                  {attendanceBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ direction: "rtl" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Students */}
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
                  <TableHead className="text-right">البرنامج</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStudents.map((student) => (
                  <TableRow
                    key={student.studentId}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/students/${student.studentId}`)
                    }
                  >
                    <TableCell className="font-medium">
                      {student.studentName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          student.attendanceRate >= 90
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {student.attendanceRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.programName}
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
