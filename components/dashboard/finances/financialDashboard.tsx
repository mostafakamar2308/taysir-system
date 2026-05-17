"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDashboardAlerts,
  getDashboardKPIs,
  getRevenueExpensesOverTime,
  getSubscriptionRetention,
  getPlanEfficiency,
  DashboardAlerts,
  DashboardKPIs,
  TimeSeriesItem,
  PlanEfficiency,
  RetentionData,
  getQuarterlyKPIs,
  QuarterlyKPIs,
} from "@/actions/finances";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TrendingDown,
  Clock,
  RefreshCw,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finances";
import dayjs from "dayjs";

interface FinancialDashboardProps {
  academyId: number;
  defaultCurrency: { code: string; symbol: string };
  period: "all" | "year" | "month";
  year: number;
  month: number;
  onAddRevenue: () => void;
  onAddExpense: () => void;
}

// ---------- Sub-components ----------
function KpiCard({
  title,
  value,
  variant,
  symbol,
  subtitle,
  isCurrency = true,
}: {
  title: string;
  value: number | string;
  variant?: "success" | "danger" | "warning" | "info";
  symbol?: string;
  subtitle?: string;
  isCurrency?: boolean;
}) {
  const colorMap = {
    success: "text-green-600",
    danger: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };
  const displayValue =
    isCurrency && typeof value === "number"
      ? formatCurrency(value, symbol)
      : typeof value === "number"
        ? value.toLocaleString()
        : value;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${variant ? colorMap[variant] : ""}`}>
          {displayValue}
          <span className="text-[10px]">{subtitle}</span>
        </p>
      </CardContent>
    </Card>
  );
}

function RetentionMatrix({ data }: { data: RetentionData }) {
  const { matrix, cohortSizes } = data;
  const cohorts = Object.keys(matrix).sort();
  if (cohorts.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        لا توجد بيانات كافية لعرض مصفوفة الاحتفاظ
      </div>
    );
  }

  const maxMonths = Math.max(...cohorts.map((c) => matrix[c].length)) || 0;

  // Color scale: 100% -> green, 70% -> yellow, <40% -> red
  const getCellColor = (val: number) => {
    if (val >= 80) return "bg-green-100 text-green-800";
    if (val >= 60) return "bg-yellow-100 text-yellow-800";
    if (val >= 40) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-3 text-sm text-muted-foreground">
        النسبة المئوية للطلاب الذين ما زالوا مشتركين بعد عدد معين من الأشهر منذ
        أول اشتراك لهم.
      </div>
      <table className="min-w-full text-sm border border-border rounded-lg">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-right p-2 font-medium">الشهر (حجم العينة)</th>
            <th className="text-right p-2 font-medium">بداية</th>
            {Array.from({ length: maxMonths - 1 }, (_, i) => (
              <th key={i} className="text-right p-2 font-medium">
                شهر {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => {
            const size = cohortSizes[cohort] || 0;
            const values = matrix[cohort];
            return (
              <tr
                key={cohort}
                className="border-t border-border hover:bg-muted/20"
              >
                <td className="p-2 font-medium whitespace-nowrap">
                  {cohort}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({size})
                  </span>
                </td>
                {Array.from({ length: maxMonths }, (_, i) => {
                  const val = values[i] ?? null;
                  return (
                    <td
                      key={i}
                      className={`p-2 text-center ${val !== null ? getCellColor(val) : "bg-muted/20 text-muted-foreground"}`}
                      title={
                        val !== null
                          ? `من ${size} طالب، بقي ${Math.round((val / 100) * size)} مشتركاً (${val}%)`
                          : "لا بيانات"
                      }
                    >
                      {val !== null ? `${val}%` : "-"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PlanEfficiencyTable({ data }: { data: PlanEfficiency[] }) {
  if (data.length === 0)
    return <p className="text-muted-foreground text-sm">لا توجد خطط</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-right p-2">الخطة</th>
            <th className="text-right p-2">الإيرادات</th>
            <th className="text-right p-2">الطلاب النشطون</th>
            <th className="text-right p-2">متوسط العائد لكل طالب</th>
          </tr>
        </thead>
        <tbody>
          {data.map((plan) => (
            <tr key={plan.planId} className="border-b">
              <td className="p-2">{plan.planName}</td>
              <td className="p-2">{formatCurrency(plan.totalRevenue)}</td>
              <td className="p-2">{plan.activeStudents}</td>
              <td className="p-2">{formatCurrency(plan.arps || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getCurrentQuarter(): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const now = dayjs();
  const year = now.year();
  const quarter = Math.ceil((now.month() + 1) / 3) as 1 | 2 | 3 | 4;
  return { year, quarter };
}

// ---------- Main Dashboard Component ----------
export default function FinancialDashboard({
  academyId,
  defaultCurrency,
  period,
  year,
  month,
  onAddRevenue,
  onAddExpense,
}: FinancialDashboardProps) {
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [chartData, setChartData] = useState<TimeSeriesItem[]>([]);
  const [retention, setRetention] = useState<RetentionData>({
    matrix: {},
    cohortSizes: {},
  });
  const [quarterKpiData, setQuarterKpiData] = useState<QuarterlyKPIs | null>(
    null,
  );
  const [planEff, setPlanEff] = useState<PlanEfficiency[]>([]);
  const [loading, setLoading] = useState(true);

  const currentQuarter = getCurrentQuarter();
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        alertsData,
        kpisData,
        quarterlyKpiData,
        timeData,
        retentionData,
        planData,
      ] = await Promise.all([
        getDashboardAlerts(academyId, period, year, month),
        getDashboardKPIs(academyId, period, year, month),
        getQuarterlyKPIs(
          academyId,
          currentQuarter.year,
          currentQuarter.quarter,
        ),
        getRevenueExpensesOverTime(academyId, period, year, month),
        getSubscriptionRetention(academyId),
        getPlanEfficiency(academyId, period, year, month),
      ]);
      setAlerts(alertsData);
      setKpis(kpisData);
      setQuarterKpiData(quarterlyKpiData);
      setChartData(timeData);
      setRetention(retentionData);
      setPlanEff(planData);
    } catch (error) {
      console.error("Dashboard data error:", error);
    } finally {
      setLoading(false);
    }
  }, [
    academyId,
    month,
    period,
    currentQuarter.year,
    currentQuarter.quarter,
    year,
  ]);

  useEffect(() => {
    fetchData();
  }, [academyId, period, fetchData, year, month]);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {loading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : alerts ? (
        <div className="grid gap-4">
          {alerts.negativeProfit && (
            <Alert variant="destructive">
              <TrendingDown className="h-4 w-4" />
              <AlertTitle>خسارة صافية</AlertTitle>
              <AlertDescription>
                الربح الصافي سلبي في هذه الفترة
              </AlertDescription>
            </Alert>
          )}
          {alerts.overdueRevenueCount > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>إيرادات متأخرة</AlertTitle>
              <AlertDescription>
                {alerts.overdueRevenueCount} دفعة غير مدفوعة
              </AlertDescription>
            </Alert>
          )}
          {alerts.upcomingRenewals > 0 && (
            <Alert>
              <RefreshCw className="h-4 w-4" />
              <AlertTitle>تجديدات قادمة</AlertTitle>
              <AlertDescription>
                {alerts.upcomingRenewals} اشتراك سينتهي قريباً
              </AlertDescription>
            </Alert>
          )}
          {alerts.overdueRenewals > 0 && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>تجديدات فائتة</AlertTitle>
              <AlertDescription>
                {alerts.overdueRenewals} اشتراك منتهي
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex justify-between flex-wrap">
          <h2 className="text-2xl font-semibold">المؤشرات المالية</h2>
          <div className="space-x-2">
            <Button onClick={onAddRevenue} variant="default" size="sm">
              <PlusCircle className="ml-2 h-4 w-4" /> إضافة إيراد
            </Button>
            <Button onClick={onAddExpense} variant="destructive" size="sm">
              <PlusCircle className="ml-2 h-4 w-4" /> إضافة مصروف
            </Button>
          </div>
        </div>
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          : kpis && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard
                  title="إجمالي الإيرادات"
                  value={kpis.totalRevenue}
                  variant="success"
                  symbol={defaultCurrency.symbol}
                />
                <KpiCard
                  title="إجمالي المصروفات"
                  value={kpis.totalExpenses}
                  variant="danger"
                  symbol={defaultCurrency.symbol}
                />
                <KpiCard
                  title="الربح الصافي"
                  value={kpis.netProfit}
                  variant={kpis.netProfit >= 0 ? "success" : "danger"}
                  symbol={defaultCurrency.symbol}
                />
                <KpiCard
                  title="الإيرادات المعلقة"
                  value={kpis.outstandingRevenue}
                  variant="warning"
                  symbol={defaultCurrency.symbol}
                />
                <KpiCard
                  title="الاشتراكات النشطة"
                  value={kpis.activeSubscriptionCount}
                  isCurrency={false}
                />
              </div>
            )}
      </div>

      <QuarterlyKPIsSection
        loading={loading}
        quarterlyKPIs={quarterKpiData}
        defaultCurrency={defaultCurrency}
        year={year}
        quarter={currentQuarter.quarter}
      />

      {/* Revenue & Expenses Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>الإيرادات والمصروفات عبر الزمن</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number"
                      ? formatCurrency(value, defaultCurrency.symbol)
                      : ""
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  fillOpacity={1}
                  fill="url(#revenue)"
                  name="الإيرادات"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#expenses)"
                  name="المصروفات"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Retention Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>مصفوفة الاحتفاظ بالاشتراكات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <RetentionMatrix data={retention} />
          )}
        </CardContent>
      </Card>

      {/* Plan Efficiency Table */}
      <Card>
        <CardHeader>
          <CardTitle>كفاءة الخطط</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <PlanEfficiencyTable data={planEff} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface QuarterlyKPIsProps {
  loading: boolean;
  quarterlyKPIs: {
    ltgp: number;
    arppu: number;
    cac: number;
    churnRate: number;
  } | null;
  defaultCurrency: { symbol: string };
  year: number;
  quarter: 1 | 2 | 3 | 4;
}

export function QuarterlyKPIsSection({
  loading,
  quarterlyKPIs,
  defaultCurrency,
  year,
  quarter,
}: QuarterlyKPIsProps) {
  const quarterTitle = `الربع ${quarter} من سنة ${year}`;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        المؤشرات الربع سنوية - {quarterTitle}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))
        ) : quarterlyKPIs ? (
          <>
            <KpiCard
              title="LTGP (إجمالي الربح مدى الحياة)"
              value={quarterlyKPIs.ltgp}
              variant="success"
              symbol={defaultCurrency.symbol}
            />
            <KpiCard
              title="ARPPU (متوسط الإيراد لكل مستخدم دافع)"
              value={quarterlyKPIs.arppu}
              variant="info"
              symbol={defaultCurrency.symbol}
              subtitle="شهرياً"
            />
            <KpiCard
              title="CAC (تكلفة اكتساب العميل)"
              value={quarterlyKPIs.cac}
              variant="warning"
              symbol={defaultCurrency.symbol}
              subtitle="إجمالي الربع"
            />
            <KpiCard
              title="معدل التراجع الشهري"
              value={quarterlyKPIs.churnRate}
              isCurrency={false}
              variant="danger"
            />
          </>
        ) : (
          <div className="col-span-4 text-center text-muted-foreground">
            لا توجد بيانات للربع المحدد
          </div>
        )}
      </div>
    </div>
  );
}
