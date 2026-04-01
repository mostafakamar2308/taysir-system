"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  Users,
  User,
  GraduationCap,
  DollarSign,
  Calendar,
  Eye,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/finances";
import dayjs from "@/lib/dayjs";

interface AdminDashboardClientProps {
  stats: {
    totalAcademies: number;
    totalUsers: number;
    totalStudents: number;
    totalTutors: number;
    activeSubscriptions: number;
    totalRevenue: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
  nearEndAcademies: {
    id: number;
    name: string;
    adminName: string | null;
    adminPhone: string | null;
    endDate: Date | null;
    planName: string | null;
  }[];
  academiesExceeding: {
    id: number;
    name: string;
    adminName: string | null;
    adminPhone: string | null;
    studentCount: number;
    tutorCount: number;
    maxStudents: number | null;
    maxTutors: number | null;
  }[];
  recentAcademies: {
    id: number;
    name: string;
    adminName: string | null;
    createdAt: Date;
    planName: string | null;
  }[];
}

export default function AdminDashboardClient({
  stats,
  monthlyRevenue,
  nearEndAcademies,
  academiesExceeding,
  recentAcademies,
}: AdminDashboardClientProps) {
  const handleWhatsApp = (phone: string | null, text?: string) => {
    if (!phone) return;
    const url = `https://wa.me/${phone.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم - الإدارة العامة</h1>
        <p className="text-muted-foreground">نظرة عامة على أداء المنصة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الأكاديميات</p>
              <p className="text-2xl font-bold">{stats.totalAcademies}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المستخدمين</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الطلاب</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المعلمين</p>
              <p className="text-2xl font-bold">{stats.totalTutors}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">اشتراكات نشطة</p>
              <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                الإيرادات الشهرية (MRR)
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue, "EGP")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            الإيرادات الشهرية (آخر 6 أشهر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value?: number) => formatCurrency(value, "EGP")}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="الإيرادات"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Near-End Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              أكاديميات قاربت على الانتهاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nearEndAcademies.length === 0 ? (
              <p className="text-muted-foreground">
                لا توجد أكاديميات قاربت على الانتهاء
              </p>
            ) : (
              <div className="space-y-3">
                {nearEndAcademies.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.planName || "بدون خطة"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        تنتهي {dayjs(a.endDate).format("DD/MM/YYYY")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {a.adminPhone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleWhatsApp(
                              a.adminPhone,
                              `مرحباً، نود إعلامك بأن اشتراك أكاديميتك ${a.name} سينتهي قريباً.`,
                            )
                          }
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/ar/dashboard/admin/academies/${a.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academies Exceeding Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              أكاديميات تجاوزت الحدود
            </CardTitle>
          </CardHeader>
          <CardContent>
            {academiesExceeding.length === 0 ? (
              <p className="text-muted-foreground">
                لا توجد أكاديميات تجاوزت الحدود
              </p>
            ) : (
              <div className="space-y-3">
                {academiesExceeding.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-sm">
                        الطلاب: {a.studentCount}
                        {a.maxStudents && a.studentCount > a.maxStudents && (
                          <span className="text-destructive">
                            {" "}
                            (حد {a.maxStudents})
                          </span>
                        )}
                      </p>
                      <p className="text-sm">
                        المعلمين: {a.tutorCount}
                        {a.maxTutors && a.tutorCount > a.maxTutors && (
                          <span className="text-destructive">
                            {" "}
                            (حد {a.maxTutors})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {a.adminPhone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleWhatsApp(
                              a.adminPhone,
                              `مرحباً، نود إعلامك بأن أكاديميتك ${a.name} تجاوزت الحدود المسموحة.`,
                            )
                          }
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/ar/dashboard/admin/academies/${a.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Academies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">أحدث الأكاديميات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>المشرف</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAcademies.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.adminName || "—"}</TableCell>
                  <TableCell>{a.planName || "—"}</TableCell>
                  <TableCell>
                    {dayjs(a.createdAt).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/ar/dashboard/admin/academies/${a.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
