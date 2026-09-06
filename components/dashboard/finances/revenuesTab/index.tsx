"use client";

import { useEffect, useState, useCallback } from "react";
import { getRevenueKPIs, RevenueKPIs } from "@/actions/finances";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finances";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paymentMethodLabels } from "@/lib/enums";
import { PaymentMethod } from "@/types/payment";
import { StudentCombobox } from "../studentCombobox";
import DebtsTab from "./debtsTab";
import OverdueTab from "./overdueTab";
import RenewalsTab from "./renewalsTab";
import HistoryTab from "./historyTab";

interface RevenuesTabProps {
  academyId: number;
  defaultCurrency: { code: string; symbol: string };
  period: "all" | "year" | "month";
  year: number;
  month: number;
  students: { id: number; name: string | null }[];
}

// Keep KPICard sub-component
function KPICard({
  title,
  value,
  symbol,
  variant,
}: {
  title: string;
  value: number;
  symbol: string;
  variant?: string;
}) {
  const color = variant === "success" ? "text-green-600" : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          {formatCurrency(value, symbol)}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Tab
export default function RevenuesTab({
  academyId,
  defaultCurrency,
  period,
  year,
  month,
  students,
}: RevenuesTabProps) {
  // Filters
  const [studentId, setStudentId] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");

  // Data (KPIs remain in the shell; sub-tabs fetch their own data lazily)
  const [kpis, setKpis] = useState<RevenueKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const studentIdNum = studentId === "all" ? undefined : parseInt(studentId);
  const methodNum = method === "all" ? undefined : parseInt(method);

  const getPaymentMethodLabel = useCallback((m?: number | null) => {
    if (m === undefined || m === null) return "—";
    return paymentMethodLabels[m as PaymentMethod] || `طريقة ${m}`;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRevenueKPIs(academyId, period, year, month, {
        studentId: studentIdNum,
        method: methodNum,
      });
      setKpis(res.ok ? res.data ?? null : null);
      if (!res.ok) {
        toast.error(
          "حدث خطأ أثناء جلب الإحصائيات" +
            (res.error ? `: ${res.error}` : ""),
        );
      }
    } catch {
      toast.error("حدث خطأ أثناء جلب الإحصائيات");
    } finally {
      setLoading(false);
    }
  }, [academyId, period, year, month, studentIdNum, methodNum]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Filters (student + method) */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">الطالب</label>
          <StudentCombobox
            students={students}
            value={studentId}
            onChange={setStudentId}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">طريقة الدفع</label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل الطرق" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الطرق</SelectItem>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setStudentId("all");
            setMethod("all");
          }}
        >
          إعادة تعيين
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          : kpis && (
              <>
                <KPICard
                  title="إجمالي الإيرادات (الفترة)"
                  value={kpis.totalRevenue}
                  symbol={defaultCurrency.symbol}
                  variant="success"
                />
                <KPICard
                  title="متوسط العائد لكل طالب دافع"
                  value={kpis.arps}
                  symbol={defaultCurrency.symbol}
                />
              </>
            )}
      </div>

      {/* Breakdowns */}
      {!loading && kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات حسب الخطة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.revenuePerPlan.map((plan) => (
                <div key={plan.planId} className="flex justify-between">
                  <span>{plan.planName}</span>
                  <span className="font-mono">
                    {formatCurrency(plan.totalRevenue, defaultCurrency.symbol)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>العائد حسب المعلم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.revenuePerTutor.map((t) => (
                <div key={t.tutorId} className="flex justify-between">
                  <span>{t.tutorName}</span>
                  <span className="font-mono">
                    {formatCurrency(t.totalRevenue, defaultCurrency.symbol)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات حسب طريقة الدفع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.revenuePerMethod.map((m) => (
                <div key={m.method} className="flex justify-between">
                  <span>{getPaymentMethodLabel(m.method)}</span>
                  <span className="font-mono">
                    {formatCurrency(m.totalRevenue, defaultCurrency.symbol)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub-tabs (lazy: each fetches its data when opened) */}
      <Tabs defaultValue="debts" dir="rtl">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger
            value="debts"
            className="flex-1 min-w-25 text-xs sm:text-sm"
          >
            مستحقات الطلاب
          </TabsTrigger>
          <TabsTrigger
            value="overdue"
            className="flex-1 min-w-25 text-xs sm:text-sm"
          >
            فواتير مسجلة متأخرة
          </TabsTrigger>
          <TabsTrigger
            value="renewals"
            className="flex-1 min-w-25 text-xs sm:text-sm"
          >
            تجديد الاشتراكات
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex-1 min-w-25 text-xs sm:text-sm"
          >
            سجل الإيرادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="debts">
          <DebtsTab
            defaultCurrency={defaultCurrency}
            studentId={studentIdNum}
          />
        </TabsContent>
        <TabsContent value="overdue">
          <OverdueTab
            academyId={academyId}
            defaultCurrency={defaultCurrency}
            period={period}
            year={year}
            month={month}
            studentId={studentIdNum}
          />
        </TabsContent>
        <TabsContent value="renewals">
          <RenewalsTab
            academyId={academyId}
            defaultCurrency={defaultCurrency}
            studentId={studentIdNum}
          />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab
            academyId={academyId}
            defaultCurrency={defaultCurrency}
            period={period}
            year={year}
            month={month}
            studentId={studentIdNum}
            method={methodNum}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}