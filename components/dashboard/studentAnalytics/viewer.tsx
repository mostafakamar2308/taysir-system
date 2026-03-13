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
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";
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
} from "recharts";

interface StudentAnalyticsClientProps {
  studentName: string;
  studentStatus: number;
  totalSessions: number;
  attendanceRate: number;
  completedTopics: number;
  totalTopics: number;
  programName: string;
  topicProgressOverTime: { month: string; label: string; value: number }[];
  attendanceTrend: { month: string; label: string; value: number }[];
  topics: {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    completedAt: string | null;
    notes: string | null;
  }[];
}

const statusMap: Record<number, { label: string; color: string }> = {
  0: {
    label: "تجريبي",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  1: {
    label: "مشترك",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  2: {
    label: "عميل محتمل",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
};

export default function StudentAnalyticsClient({
  studentName,
  studentStatus,
  totalSessions,
  attendanceRate,
  completedTopics,
  totalTopics,
  programName,
  topicProgressOverTime,
  attendanceTrend,
  topics,
}: StudentAnalyticsClientProps) {
  const router = useRouter();
  const statusInfo = statusMap[studentStatus] || {
    label: "غير معروف",
    color: "bg-gray-100 text-gray-800",
  };

  const summaryCards = [
    { title: "إجمالي الحصص", value: totalSessions.toString(), icon: Calendar },
    { title: "نسبة الحضور", value: `${attendanceRate}%`, icon: TrendingUp },
    {
      title: "المواضيع المكتملة",
      value: `${completedTopics}/${totalTopics}`,
      icon: CheckCircle2,
    },
    { title: "البرنامج الحالي", value: programName, icon: BookOpen },
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
          {studentName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{studentName}</h1>
          <Badge variant="secondary" className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
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
            <CardTitle className="text-base">
              المواضيع المكتملة عبر الوقت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={topicProgressOverTime}>
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
                  name="مواضيع مكتملة"
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">اتجاه الحضور الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attendanceTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ direction: "rtl" }} />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="نسبة الحضور %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Program Topics Progress */}
      {topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              تقدم المواضيع في البرنامج
            </CardTitle>
            <div className="flex items-center gap-3 mt-2">
              <Progress
                value={(completedTopics / totalTopics) * 100}
                className="h-2 flex-1 max-w-xs"
              />
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round((completedTopics / totalTopics) * 100)}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموضوع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ الإكمال</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell className="font-medium">
                        {topic.title}
                      </TableCell>
                      <TableCell>
                        {topic.completed ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            مكتمل
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            قيد التقدم
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {topic.completedAt || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {topic.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
