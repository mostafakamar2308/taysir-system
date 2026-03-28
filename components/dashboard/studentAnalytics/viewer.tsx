"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, TrendingUp } from "lucide-react";
import {
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
  attendanceTrend: { month: string; label: string; value: number }[];
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
  attendanceTrend,
}: StudentAnalyticsClientProps) {
  const router = useRouter();
  const statusInfo = statusMap[studentStatus] || {
    label: "غير معروف",
    color: "bg-gray-100 text-gray-800",
  };

  const summaryCards = [
    {
      title: "إجمالي الحصص الكلية",
      value: totalSessions.toString(),
      icon: Calendar,
    },
    {
      title: "نسبة الحضور الكلية",
      value: `${attendanceRate}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/ar/dashboard/analytics")}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اتجاه الحضور الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ direction: "rtl" }} />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="نسبة الحضور %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
