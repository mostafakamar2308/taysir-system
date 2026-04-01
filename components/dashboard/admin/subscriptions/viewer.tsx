"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search, MessageSquare, DollarSign } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/finances";
import dayjs from "@/lib/dayjs";

interface AcademySaas {
  id: number;
  name: string;
  adminName: string | null;
  adminPhone: string | null;
  saasPlanName: string | null;
  saasPlanPrice: number | null;
  saasPlanMaxStudents: number | null;
  saasPlanMaxTutors: number | null;
  startDate: string | null;
  endDate: string | null;
  studentCount: number;
  tutorCount: number;
}

interface PlanStat {
  id: number;
  name: string;
  price: number;
  academiesCount: number;
  activeCount: number;
  totalRevenue: number;
}

interface SaasSubscriptionsClientProps {
  academies: AcademySaas[];
  planStats: PlanStat[];
  mrr: number;
  nearEnd: AcademySaas[];
  expired: AcademySaas[];
}

export default function SaasSubscriptionsClient({
  academies,
  planStats,
  mrr,
  expired,
  nearEnd,
}: SaasSubscriptionsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired" | "nearEnd"
  >("all");

  const filtered = academies.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (statusFilter === "active")
      return a.endDate && dayjs(a.endDate).isAfter(dayjs());
    if (statusFilter === "expired")
      return a.endDate && dayjs(a.endDate).isBefore(dayjs());
    if (statusFilter === "nearEnd") {
      if (!a.endDate) return false;
      const daysLeft = dayjs(a.endDate).diff(dayjs(), "day");
      return daysLeft >= 0 && daysLeft <= 7;
    }
    return true;
  });

  const getStatusBadge = (endDate: string | null) => {
    if (!endDate) return <Badge variant="outline">غير محدد</Badge>;
    const now = dayjs();
    const end = dayjs(endDate);
    if (end.isBefore(now))
      return <Badge className="bg-red-100 text-red-700">منتهية</Badge>;
    const daysLeft = end.diff(now, "day");
    if (daysLeft <= 7)
      return (
        <Badge className="bg-amber-100 text-amber-700">
          تنتهي قريباً ({daysLeft} يوم)
        </Badge>
      );
    return <Badge className="bg-green-100 text-green-700">نشطة</Badge>;
  };

  const handleWhatsApp = (phone: string | null, text?: string) => {
    if (!phone) return;
    const url = `https://wa.me/${phone.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">اشتراكات الأكاديميات</h1>
        <p className="text-muted-foreground">
          إدارة خطط الاشتراك وأداء الأكاديميات
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">
                  الإيرادات الشهرية المتكررة (MRR)
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(mrr, "EGP")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">الأكاديميات النشطة</p>
            <p className="text-2xl font-bold">
              {
                academies.filter(
                  (a) => a.endDate && dayjs(a.endDate).isAfter(dayjs()),
                ).length
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              الأكاديميات المنتهية
            </p>
            <p className="text-2xl font-bold text-destructive">
              {expired.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تفاصيل الخطط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الخطة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الأكاديميات (إجمالي / نشط)</TableHead>
                  <TableHead>إجمالي الإيرادات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planStats.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{formatCurrency(p.price, "EGP")}</TableCell>
                    <TableCell>
                      {p.academiesCount} / {p.activeCount}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(p.totalRevenue, "EGP")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم الأكاديمية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            الكل
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            نشطة
          </Button>
          <Button
            variant={statusFilter === "nearEnd" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("nearEnd")}
          >
            قاربت على الانتهاء
          </Button>
          <Button
            variant={statusFilter === "expired" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("expired")}
          >
            منتهية
          </Button>
        </div>
      </div>

      {/* Academies Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الأكاديمية</TableHead>
                  <TableHead>المشرف</TableHead>
                  <TableHead>الخطة</TableHead>
                  <TableHead>الاستخدام</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تواصل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد أكاديميات
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => {
                    const isOverStudents =
                      a.saasPlanMaxStudents &&
                      a.studentCount > a.saasPlanMaxStudents;
                    const isOverTutors =
                      a.saasPlanMaxTutors && a.tutorCount > a.saasPlanMaxTutors;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/academies/${a.id}`}
                            className="hover:underline"
                          >
                            {a.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {a.adminName || "—"}
                          <div className="text-xs text-muted-foreground">
                            {a.adminPhone || "لا يوجد هاتف"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {a.saasPlanName ? (
                            <div>
                              {a.saasPlanName}
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(a.saasPlanPrice || 0, "EGP")}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span>طلاب: {a.studentCount}</span>
                              {a.saasPlanMaxStudents && (
                                <span className="text-xs text-muted-foreground">
                                  / {a.saasPlanMaxStudents}
                                </span>
                              )}
                              {isOverStudents && (
                                <AlertTriangle className="h-3 w-3 text-destructive" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span>معلمين: {a.tutorCount}</span>
                              {a.saasPlanMaxTutors && (
                                <span className="text-xs text-muted-foreground">
                                  / {a.saasPlanMaxTutors}
                                </span>
                              )}
                              {isOverTutors && (
                                <AlertTriangle className="h-3 w-3 text-destructive" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(a.endDate)}</TableCell>
                        <TableCell>
                          {a.adminPhone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleWhatsApp(
                                  a.adminPhone,
                                  `مرحباً، نود إعلامك بأن اشتراك أكاديميتك ${a.name} ${a.endDate && dayjs(a.endDate).isBefore(dayjs()) ? "انتهى" : "سينتهي قريباً"}.`,
                                )
                              }
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
