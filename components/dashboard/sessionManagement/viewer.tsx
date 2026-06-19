"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Eye } from "lucide-react";
import SessionManagementDetailPanel from "./sessionDetailPanel"; // updated import

interface Stats {
  totalSessions: number;
  avgPerStudent: string;
  avgPerTutor: string;
  completionRate: string;
  cancellationRate: string;
  absenceRate: string;
}

interface CancellationAnalysis {
  byTutor: number;
  byStudent: number;
  other: number;
}

interface RunningSession {
  id: number;
  startTime: string;
  endTime: string;
  studentName: string;
  tutorName: string;
  topic: string | null;
}

interface TodaySession {
  id: number;
  startTime: string;
  endTime: string;
  studentName: string;
  studentPhone: string | null;
  topic: string | null;
  status: number; // 0 scheduled, 1 completed, 2 cancelled
  attendance: {
    studentStatus: number | null;
    tutorStatus: number | null;
    reason: string | null;
  } | null;
  hasReport: boolean;
  reportRating: number | null;
}

interface TutorGroup {
  tutorId: number;
  tutorName: string;
  tutorPhone: string | null;
  sessions: TodaySession[];
}

interface Props {
  stats: Stats;
  cancellationAnalysis: CancellationAnalysis;
  dayOfWeekCounts: number[];
  hourCounts: number[];
  avgRating: number;
  ratingDistribution: Record<number, number>;
  runningSessions: RunningSession[];
  todayGroupedByTutor: TutorGroup[];
}

const dayNames = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];

export default function SessionsManagementClient(props: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );

  const dayChartData = props.dayOfWeekCounts.map((count, i) => ({
    name: dayNames[i],
    count,
  }));

  const hourChartData = props.hourCounts.map((count, i) => ({
    name: hourLabels[i],
    count,
  }));

  const ratingDistData = [1, 2, 3, 4, 5].map((r) => ({
    name: `${r} ★`,
    value: props.ratingDistribution[r] || 0,
  }));

  const cancelDistData = [
    { name: "المعلم", value: props.cancellationAnalysis.byTutor },
    { name: "الطالب", value: props.cancellationAnalysis.byStudent },
    { name: "آخر", value: props.cancellationAnalysis.other },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <h1 className="text-2xl font-bold">إدارة الحصص</h1>

      {/* إحصائيات رئيسية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="إجمالي الحصص" value={props.stats.totalSessions} />
        <StatCard title="متوسط الحصص/طالب" value={props.stats.avgPerStudent} />
        <StatCard title="متوسط الحصص/معلم" value={props.stats.avgPerTutor} />
        <StatCard
          title="نسبة الإكمال"
          value={`${props.stats.completionRate}%`}
        />
        <StatCard
          title="نسبة الإلغاء"
          value={`${props.stats.cancellationRate}%`}
        />
        <StatCard title="نسبة الغياب" value={`${props.stats.absenceRate}%`} />
      </div>

      {/* تحليل الإلغاء */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تحليل الإلغاء</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart width={300} height={200}>
            <Pie
              data={cancelDistData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) =>
                percent ? `${name} ${(percent * 100).toFixed(0)}%` : `${name}`
              }
            >
              {cancelDistData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </CardContent>
      </Card>

      {/* أنماط التوزيع */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">حجم الحصص حسب اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={400} height={250} data={dayChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">حجم الحصص حسب الساعة</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={400} height={250} data={hourChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={2} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </CardContent>
        </Card>
      </div>

      {/* جودة الجلسات */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">متوسط التقييم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center">
              {props.avgRating.toFixed(1)} / 5
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع التقييمات</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart width={300} height={200}>
              <Pie
                data={ratingDistData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              >
                {ratingDistData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </CardContent>
        </Card>
      </div>

      {/* الجلسات الجارية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الحصص الجارية الآن</CardTitle>
        </CardHeader>
        <CardContent>
          {props.runningSessions.length === 0 ? (
            <p className="text-muted-foreground">لا توجد حصص جارية</p>
          ) : (
            <ul className="space-y-2">
              {props.runningSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <span className="font-medium">{s.tutorName}</span> مع{" "}
                    <span className="text-primary">{s.studentName}</span>
                    <span className="text-sm text-muted-foreground mr-2">
                      {s.topic || "بدون موضوع"} –{" "}
                      {new Date(s.startTime).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSessionId(s.id)}
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    تفاصيل
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* حصص اليوم حسب المعلم */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">حصص اليوم</h2>
        {props.todayGroupedByTutor.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">لا توجد حصص اليوم</p>
            </CardContent>
          </Card>
        ) : (
          props.todayGroupedByTutor.map((group) => (
            <Card key={group.tutorId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{group.tutorName}</CardTitle>
                  {group.tutorPhone && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://wa.me/${group.tutorPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        واتساب
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-right">الطالب</th>
                      <th className="p-2 text-right">الوقت</th>
                      <th className="p-2 text-right">الموضوع</th>
                      <th className="p-2 text-right">الحالة</th>
                      <th className="p-2 text-right">الحضور</th>
                      <th className="p-2 text-right">التقرير</th>
                      <th className="p-2 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.sessions.map((s) => (
                      <tr key={s.id} className="border-t hover:bg-muted/50">
                        <td className="p-2">{s.studentName}</td>
                        <td className="p-2">
                          {new Date(s.startTime).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          –{" "}
                          {new Date(s.endTime).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-2">{s.topic || "—"}</td>
                        <td className="p-2">
                          <Badge
                            className={
                              s.status === 2
                                ? "bg-red-100 text-red-700"
                                : s.status === 1
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                            }
                          >
                            {s.status === 2
                              ? "ملغاة"
                              : s.status === 1
                                ? "مكتملة"
                                : "مجدولة"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {s.attendance?.studentStatus != null ? (
                            <Badge
                              className={attendanceBadge(
                                s.attendance.studentStatus,
                              )}
                            >
                              {attendanceLabel(s.attendance.studentStatus)}
                            </Badge>
                          ) : s.status === 1 ? (
                            <span className="text-amber-600 text-xs">
                              غير مسجل
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2">
                          {s.hasReport ? (
                            s.reportRating ? (
                              <span className="text-green-600 font-medium">
                                {s.reportRating}/5
                              </span>
                            ) : (
                              <span className="text-blue-600 text-xs">
                                مكتمل
                              </span>
                            )
                          ) : s.status === 1 ? (
                            <span className="text-red-600 text-xs">ناقص</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSessionId(s.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* لوحة تفاصيل الجلسة */}
      {selectedSessionId && (
        <SessionManagementDetailPanel
          sessionId={selectedSessionId}
          open={!!selectedSessionId}
          onOpenChange={(open) => {
            if (!open) setSelectedSessionId(null);
          }}
        />
      )}
    </div>
  );
}

// مساعدات للحضور
function attendanceBadge(status: number): string {
  switch (status) {
    case 0:
      return "bg-green-100 text-green-700"; // ATTENDED
    case 3:
      return "bg-orange-100 text-orange-700"; // LATE
    case 1:
      return "bg-yellow-100 text-yellow-700"; // ABSENT_EXCUSED
    case 2:
      return "bg-red-100 text-red-700"; // ABSENT_UNEXCUSED
    default:
      return "";
  }
}

function attendanceLabel(status: number): string {
  switch (status) {
    case 0:
      return "حاضر";
    case 3:
      return "متأخر";
    case 1:
      return "غائب بعذر";
    case 2:
      return "غائب بدون عذر";
    default:
      return "";
  }
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
