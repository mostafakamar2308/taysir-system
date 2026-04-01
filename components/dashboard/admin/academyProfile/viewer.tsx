"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/finances";
import dayjs from "@/lib/dayjs";

interface AcademyProfileProps {
  academy: {
    id: number;
    name: string;
    adminName: string | null;
    adminEmail: string | null;
    studentCount: number;
    tutorCount: number;
    totalRevenue: number;
    totalExpenses: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    saasPlan: {
      name: string;
      price: number;
      maxStudents: number;
      maxTutors: number;
      billingPeriod: number;
    } | null;
    saasPlanStartDate: Date | null;
    saasPlanEndDate: Date | null;
  };
}

export default function AcademyProfileClient({ academy }: AcademyProfileProps) {
  const isTrialActive =
    academy.saasPlanEndDate && dayjs().isBefore(dayjs(academy.saasPlanEndDate));
  const isExpired =
    academy.saasPlanEndDate && dayjs().isAfter(dayjs(academy.saasPlanEndDate));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{academy.name}</h1>
          <p className="text-muted-foreground">إدارة الأكاديمية</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/ar/dashboard/admin/academies">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للقائمة
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الطلاب</p>
              <p className="text-2xl font-bold">{academy.studentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المعلمين</p>
              <p className="text-2xl font-bold">{academy.tutorCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold">
                {formatCurrency(academy.totalRevenue, "EGP")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
              <p className="text-2xl font-bold">
                {formatCurrency(academy.totalExpenses, "EGP")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الإيرادات هذا الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(academy.monthlyRevenue, "EGP")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المصروفات هذا الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              {formatCurrency(academy.monthlyExpenses, "EGP")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin & Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المشرف والخطة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">المشرف</p>
            <p className="font-medium">{academy.adminName || "—"}</p>
            <p className="text-sm text-muted-foreground">
              {academy.adminEmail || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">الخطة</p>
            {academy.saasPlan ? (
              <div>
                <p className="font-medium">{academy.saasPlan.name}</p>
                <p className="text-sm">
                  {formatCurrency(academy.saasPlan.price, "EGP")} /{" "}
                  {academy.saasPlan.billingPeriod} يوم
                </p>
                <p className="text-xs text-muted-foreground">
                  حد الطلاب: {academy.saasPlan.maxStudents}
                </p>
                <p className="text-xs text-muted-foreground">
                  حد المعلمين: {academy.saasPlan.maxTutors}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">لا توجد خطة</p>
            )}
            {academy.saasPlanStartDate && (
              <p className="text-xs text-muted-foreground mt-2">
                بداية الخطة:{" "}
                {dayjs(academy.saasPlanStartDate).format("DD/MM/YYYY")}
              </p>
            )}
            {academy.saasPlanEndDate && (
              <p className="text-xs text-muted-foreground">
                {isTrialActive ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> فترة تجريبية تنتهي{" "}
                    {dayjs(academy.saasPlanEndDate).format("DD/MM/YYYY")}
                  </span>
                ) : isExpired ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> انتهت الفترة التجريبية
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> تنتهي{" "}
                    {dayjs(academy.saasPlanEndDate).format("DD/MM/YYYY")}
                  </span>
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
