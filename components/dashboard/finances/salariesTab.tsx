"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSalaryData,
  payTutor,
  getDefaultCurrencyId,
} from "@/actions/finances";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/finances";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, TrendingUp, Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dayjs from "dayjs";

interface SalariesTabProps {
  academyId: number;
  defaultCurrency: { code: string; symbol: string };
  tutors: { id: number; name: string }[];
}

export interface SalaryBreakdownRow {
  groupId: number;
  groupTitle: string;
  isPrivate: boolean;
  rate: number;
  sessionCount: number;
  totalMinutes: number;
  earnings: number;
}

export interface SalaryPaymentRecord {
  id: number;
  date: string;
  amount: number;
  description: string;
  notes: string | null;
}

export interface SalaryMonthData {
  totalPaidSalaries: number;
  highestPaidTutors: { tutorId: number; name: string; totalPaid: number }[];
  avgSessionsPerTutor: number;
  avgRevenuePerTutor: number;
  tutors: {
    tutorId: number;
    tutorName: string;
    privatePricePerHour: number;
    groupPricePerHour: number;
    completedSessions: number;
    totalMinutes: number;
    expectedSalary: number;
    paidAmount: number;
    outstanding: number;
    breakdown: SalaryBreakdownRow[];
    paidPayments: SalaryPaymentRecord[];
  }[];
  revenuePerTutor: { tutorId: number; name: string; totalRevenue: number }[];
}

export interface TutorSalaryInfo {
  tutorId: number;
  tutorName: string;
  privatePricePerHour: number;
  groupPricePerHour: number;
  completedSessions: number;
  totalMinutes: number;
  expectedSalary: number;
  paidAmount: number;
  outstanding: number;
  breakdown: SalaryBreakdownRow[];
  paidPayments: SalaryPaymentRecord[];
}

export default function SalariesTab({
  academyId,
  defaultCurrency,
  tutors,
}: SalariesTabProps) {
  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [tutorFilter, setTutorFilter] = useState<string>("all");

  const [data, setData] = useState<SalaryMonthData | null>(null);
  const [loading, setLoading] = useState(true);

  // Pay tutor dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingTutor, setPayingTutor] = useState<TutorSalaryInfo | null>(null);
  const [payAmount, setPayAmount] = useState("0");
  const [paying, setPaying] = useState(false);

  const tutorIdFilter =
    tutorFilter === "all" ? undefined : parseInt(tutorFilter);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSalaryData(
        academyId,
        selectedYear,
        selectedMonth,
        tutorIdFilter,
      );
      setData(res.ok ? res.data ?? null : null);
    } catch {
      toast.error("فشل تحميل بيانات الرواتب");
    } finally {
      setLoading(false);
    }
  }, [academyId, selectedYear, selectedMonth, tutorIdFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayTutor = async () => {
    if (!payingTutor) return;
    if (parseFloat(payAmount) <= 0) {
      toast.error("المبلغ غير صحيح");
      return;
    }
    try {
      setPaying(true);
      const defaultCurrencyRes = await getDefaultCurrencyId(academyId);
      const defaultCurrencyId = defaultCurrencyRes.ok
        ? defaultCurrencyRes.data
        : null;
      if (!defaultCurrencyId) throw new Error("Default currency not found");
      await payTutor(
        academyId,
        payingTutor.tutorId,
        parseFloat(payAmount),
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
        defaultCurrencyId,
      );
      toast.success("تم دفع الراتب بنجاح");
      setPayDialogOpen(false);
      fetchData();
    } catch {
      toast.error("فشل دفع الراتب");
    } finally {
      setPaying(false);
    }
  };

  const openPayDialog = (tutor: TutorSalaryInfo) => {
    setPayingTutor(tutor);
    setPayAmount(tutor.outstanding.toString());
    setPayDialogOpen(true);
  };

  const minYear = currentYear - 2;
  const maxYear = currentYear + 2;
  const atCurrentMonth =
    selectedYear > currentYear ||
    (selectedYear === currentYear && selectedMonth >= currentMonth);
  const atMinBoundary = selectedYear === minYear && selectedMonth === 1;

  const goToPreviousMonth = () => {
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    if (prevYear < minYear) return;
    setSelectedYear(prevYear);
    setSelectedMonth(prevMonth);
  };

  const goToNextMonth = () => {
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    if (nextYear > maxYear) return;
    if (
      nextYear > currentYear ||
      (nextYear === currentYear && nextMonth > currentMonth)
    )
      return;
    setSelectedYear(nextYear);
    setSelectedMonth(nextMonth);
  };

  // Generators for month/year selects
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const monthOptions = [
    { value: 1, label: "يناير" },
    { value: 2, label: "فبراير" },
    { value: 3, label: "مارس" },
    { value: 4, label: "أبريل" },
    { value: 5, label: "مايو" },
    { value: 6, label: "يونيو" },
    { value: 7, label: "يوليو" },
    { value: 8, label: "أغسطس" },
    { value: 9, label: "سبتمبر" },
    { value: 10, label: "أكتوبر" },
    { value: 11, label: "نوفمبر" },
    { value: 12, label: "ديسمبر" },
  ];

  return (
    <div className="space-y-6">
      {/* Month/Year Filter */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">السنة</label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">الشهر</label>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الشهر" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">المعلم</label>
          <Select value={tutorFilter} onValueChange={setTutorFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="كل المعلمين" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المعلمين</SelectItem>
              {tutors.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setTutorFilter("all");
          }}
        >
          إعادة تعيين
        </Button>
      </div>

      {/* KPI Cards */}
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
          : data && (
              <>
                <KPICard
                  title="إجمالي الرواتب المدفوعة"
                  value={data.totalPaidSalaries}
                  symbol={defaultCurrency.symbol}
                  icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
                />
                <KPICard
                  title="متوسط عدد الجلسات لكل معلم"
                  value={data.avgSessionsPerTutor}
                  isCurrency={false}
                  icon={<Clock className="h-5 w-5 text-muted-foreground" />}
                />
                <KPICard
                  title="متوسط العائد لكل معلم"
                  value={data.avgRevenuePerTutor}
                  symbol={defaultCurrency.symbol}
                  icon={
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  }
                />
                {/* Most paid tutor? We'll put highest paid in a list below */}
              </>
            )}
      </div>

      {/* Highest Paid Tutors & Revenue per Tutor side by side */}
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>أعلى المعلمين أجراً</CardTitle>
            </CardHeader>
            <CardContent>
              {data.highestPaidTutors.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا توجد مدفوعات</p>
              ) : (
                <ul className="space-y-2">
                  {data.highestPaidTutors.map((t) => (
                    <li key={t.tutorId} className="flex justify-between">
                      <span>{t.name}</span>
                      <span className="font-mono">
                        {formatCurrency(t.totalPaid, defaultCurrency.symbol)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>العائد لكل معلم</CardTitle>
            </CardHeader>
            <CardContent>
              {data.revenuePerTutor.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا توجد إيرادات</p>
              ) : (
                <ul className="space-y-2">
                  {data.revenuePerTutor.map((t) => (
                    <li key={t.tutorId} className="flex justify-between">
                      <span>{t.name}</span>
                      <span className="font-mono">
                        {formatCurrency(t.totalRevenue, defaultCurrency.symbol)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tutor Salaries Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            رواتب المعلمين -{" "}
            {monthOptions.find((m) => m.value === selectedMonth)?.label}{" "}
            {selectedYear}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={loading || atMinBoundary}
              title="الشهر السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              disabled={loading || atCurrentMonth}
              title="الشهر التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-60 w-full" />
          ) : !data || data.tutors.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المعلم</TableHead>
                    <TableHead>سعر الساعة الفردية</TableHead>
                    <TableHead>سعر الساعة الجماعية</TableHead>
                    <TableHead>الجلسات المكتملة</TableHead>
                    <TableHead>الراتب المتوقع</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tutors.map((tutor) => (
                    <TableRow key={tutor.tutorId}>
                      <TableCell>{tutor.tutorName}</TableCell>
                      <TableCell>
                        {formatCurrency(
                          tutor.privatePricePerHour,
                          defaultCurrency.symbol,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          tutor.groupPricePerHour,
                          defaultCurrency.symbol,
                        )}
                      </TableCell>
                      <TableCell>{tutor.completedSessions}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(
                          tutor.expectedSalary,
                          defaultCurrency.symbol,
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-green-600">
                        {formatCurrency(
                          tutor.paidAmount,
                          defaultCurrency.symbol,
                        )}
                      </TableCell>
                      <TableCell
                        className={`font-mono ${tutor.outstanding > 0 ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {formatCurrency(
                          tutor.outstanding,
                          defaultCurrency.symbol,
                        )}
                      </TableCell>
                      <TableCell>
                        {tutor.outstanding > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPayDialog(tutor)}
                          >
                            <Banknote className="h-4 w-4 ml-1" /> دفع الراتب
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Tutor Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>دفع راتب {payingTutor?.tutorName}</DialogTitle>
            <DialogDescription>
              المبلغ المستحق:{" "}
              {formatCurrency(
                payingTutor?.outstanding || 0,
                defaultCurrency.symbol,
              )}
            </DialogDescription>
          </DialogHeader>

          {payingTutor && payingTutor.breakdown.length > 0 && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-semibold">كيف تم حساب الراتب؟</p>

              {/* Per-group breakdown */}
              <div className="space-y-2">
                {payingTutor.breakdown.map((row) => (
                  <div
                    key={`${row.groupId}-${row.rate}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{row.groupTitle}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          row.isPrivate
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {row.isPrivate ? "خاص" : "مجموعة"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap">
                      <span>{row.sessionCount} جلسة</span>
                      <span>
                        {row.rate}/س
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(row.earnings, defaultCurrency.symbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الراتب المتوقع</span>
                  <span>
                    {formatCurrency(
                      payingTutor.expectedSalary,
                      defaultCurrency.symbol,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    المدفوع هذا الشهر
                  </span>
                  <span className="text-green-600">
                    -{" "}
                    {formatCurrency(
                      payingTutor.paidAmount,
                      defaultCurrency.symbol,
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>المتبقي</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      payingTutor.outstanding,
                      defaultCurrency.symbol,
                    )}
                  </span>
                </div>
              </div>

              {/* Actual paid payments this month */}
              {payingTutor.paidPayments.length > 0 && (
                <div className="border-t pt-2 space-y-2">
                  <p className="text-sm font-medium">مدفوعات هذا الشهر</p>
                  <div className="space-y-1 text-sm">
                    {payingTutor.paidPayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-muted-foreground text-xs">
                            {dayjs(p.date).format("DD/MM/YYYY")}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.description}
                          </span>
                        </div>
                        <span className="font-medium whitespace-nowrap">
                          {formatCurrency(p.amount, defaultCurrency.symbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label>المبلغ</Label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handlePayTutor} disabled={paying}>
              تأكيد الدفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPICard({
  title,
  value,
  symbol,
  isCurrency = true,
  icon,
}: {
  title: string;
  value: number;
  symbol?: string;
  isCurrency?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isCurrency && symbol
            ? formatCurrency(value, symbol)
            : value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  );
}
