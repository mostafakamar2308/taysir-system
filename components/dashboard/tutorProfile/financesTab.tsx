"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Banknote,
  History,
  Undo2,
  Wallet,
  Clock,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import { computeTutorFinancialSummary } from "@/lib/tutorFinances";
import { getTutorPeriodRange, monthLabel } from "@/lib/tutorPeriod";
import {
  sessionStatusLabels,
  sessionStatusColors,
  paymentStatusLabels,
  paymentStatusColors,
  paymentMethodLabels,
} from "@/lib/enums";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { SessionStatus } from "@/types/session";
import type {
  TutorFinancesInput,
  TutorPeriod,
  TutorPeriodPreset,
} from "@/types/tutorFinances";
import PayTutorDialog from "./dialogs/payTutorDialog";
import ReversePaymentDialog from "./dialogs/reversePaymentDialog";

interface Props {
  tutorId: number;
  tutorName: string;
  data: TutorFinancesInput;
  isAdmin?: boolean;
}

function fmtMoney(amount: number, symbol: string): string {
  return `${amount.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ${symbol}`;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return dayjs(value).format("D MMM YYYY");
}

export default function FinancesTab({
  tutorId,
  tutorName,
  data,
  isAdmin = true,
}: Props) {
  const router = useRouter();
  const [preset, setPreset] = useState<TutorPeriodPreset>("currentMonth");
  const [customFrom, setCustomFrom] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [customTo, setCustomTo] = useState(
    dayjs().endOf("month").format("YYYY-MM-DD"),
  );
  const [payOpen, setPayOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<number | null>(null);

  const refresh = () => router.refresh();

  const period = useMemo<TutorPeriod>(
    () => {
      if (preset === "custom") {
        return {
          preset,
          from: new Date(`${customFrom}T00:00:00Z`),
          to: new Date(`${customTo}T23:59:59Z`),
        };
      }
      return getTutorPeriodRange(preset);
    },
    [preset, customFrom, customTo],
  );

  const summary = useMemo(
    () => computeTutorFinancialSummary(data, period),
    [data, period],
  );

  const symbol = summary.defaultCurrency.symbol;
  const outstandingPeriods = summary.byPeriod.filter((p) => p.outstanding > 0);
  const unpaidSessions = summary.sessions.filter(
    (s) => s.payable && !s.paid,
  );

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" /> مالية المعلم
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border overflow-hidden">
              <Button
                size="sm"
                variant={preset === "currentMonth" ? "default" : "ghost"}
                className="rounded-none"
                onClick={() => setPreset("currentMonth")}
              >
                هذا الشهر
              </Button>
              <Button
                size="sm"
                variant={preset === "prevMonth" ? "default" : "ghost"}
                className="rounded-none"
                onClick={() => setPreset("prevMonth")}
              >
                الشهر السابق
              </Button>
              <Button
                size="sm"
                variant={preset === "custom" ? "default" : "ghost"}
                className="rounded-none"
                onClick={() => setPreset("custom")}
              >
                مخصص
              </Button>
            </div>
            {preset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <span className="text-sm text-muted-foreground">إلى</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-md border px-2 py-1 text-sm"
                />
              </div>
            )}
            {isAdmin && (
              <Button size="sm" onClick={() => setPayOpen(true)}>
                <Banknote className="h-4 w-4 ml-1" /> تسجيل دفعة
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold">
                {fmtMoney(summary.earned, symbol)}
              </div>
              <div className="text-xs text-muted-foreground">مستحقات الفترة</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold text-green-600">
                {fmtMoney(summary.paid, symbol)}
              </div>
              <div className="text-xs text-muted-foreground">مدفوع الفترة</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold text-red-600">
                {fmtMoney(summary.outstanding, symbol)}
              </div>
              <div className="text-xs text-muted-foreground">متبقٍ على الفترة</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold">{summary.payableSessionCount}</div>
              <div className="text-xs text-muted-foreground">حصص مدفوعة الأجر</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              الفترة: {fmtDate(summary.period.from)} — {fmtDate(summary.period.to)}
            </span>
            {summary.totalOutstanding > 0 && (
              <Badge variant="destructive" className="text-sm">
                إجمالي المتأخرات غير المسددة:{" "}
                {fmtMoney(summary.totalOutstanding, symbol)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Outstanding warning */}
      {outstandingPeriods.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            <div className="font-medium">
              فترات عليها رصيد مستحق ({outstandingPeriods.length})
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {outstandingPeriods.map((p) => (
                <Badge key={p.month} variant="outline" className="text-amber-700">
                  {monthLabel(p.month)}: {fmtMoney(p.outstanding, symbol)}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions needing attention */}
      {unpaidSessions.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {unpaidSessions.length} حصة مدفوعة الأجر غير مسددة في الفترة المحددة
          </AlertDescription>
        </Alert>
      )}

      {/* Breakdown by group */}
      <div>
        <h2 className="text-lg font-semibold mb-3">المستحقات حسب المجموعة</h2>
        {summary.byGroup.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              لا توجد حصص مدفوعة الأجر في هذه الفترة
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المجموعة</TableHead>
                    <TableHead>سعر الساعة</TableHead>
                    <TableHead>عدد الحصص</TableHead>
                    <TableHead>الدقائق</TableHead>
                    <TableHead className="text-left">المستحقات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.byGroup.map((g) => (
                    <TableRow key={`${g.groupId}:${g.rate}`}>
                      <TableCell className="font-medium">{g.groupTitle}</TableCell>
                      <TableCell>{g.rate}</TableCell>
                      <TableCell>{g.sessionCount}</TableCell>
                      <TableCell>{g.totalMinutes}</TableCell>
                      <TableCell className="text-left font-medium">
                        {fmtMoney(g.earnings, symbol)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40">
                    <TableCell className="font-semibold" colSpan={4}>
                      الإجمالي
                    </TableCell>
                    <TableCell className="text-left font-bold">
                      {fmtMoney(summary.earned, symbol)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Period breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-3">المستحقات حسب الشهر</h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {summary.byPeriod.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                لا توجد بيانات مالية
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>الحصص</TableHead>
                    <TableHead className="text-left">المستحقات</TableHead>
                    <TableHead className="text-left">المدفوع</TableHead>
                    <TableHead className="text-left">المتبقي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.byPeriod.map((p) => (
                    <TableRow
                      key={p.month}
                      className={p.outstanding > 0 ? "bg-red-50/60" : ""}
                    >
                      <TableCell className="font-medium">
                        {monthLabel(p.month)}
                      </TableCell>
                      <TableCell>{p.sessionCount}</TableCell>
                      <TableCell className="text-left">
                        {fmtMoney(p.earned, symbol)}
                      </TableCell>
                      <TableCell className="text-left text-green-600">
                        {fmtMoney(p.paid, symbol)}
                      </TableCell>
                      <TableCell
                        className={`text-left font-medium ${
                          p.outstanding > 0 ? "text-red-600" : ""
                        }`}
                      >
                        {fmtMoney(p.outstanding, symbol)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">تفاصيل الحصص</h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {summary.sessions.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                لا توجد حصص في هذه الفترة
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المجموعة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>سعر الساعة</TableHead>
                    <TableHead className="text-left">المستحقات</TableHead>
                    <TableHead>الدفع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{fmtDate(s.startTime)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.groupTitle}</div>
                        {s.isTrial && (
                          <Badge variant="secondary" className="mt-0.5">
                            تجريبي
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={sessionStatusColors[s.status]}>
                          {sessionStatusLabels[s.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.durationMinutes} د</TableCell>
                      <TableCell>{s.tutorRate}</TableCell>
                      <TableCell className="text-left font-medium">
                        {s.payable ? fmtMoney(s.earnings, symbol) : "—"}
                      </TableCell>
                      <TableCell>
                        {s.status === SessionStatus.CANCELLED ? (
                          <Badge variant="secondary">ملغاة</Badge>
                        ) : s.payable ? (
                          s.paid ? (
                            <Badge className="bg-green-100 text-green-700">
                              مدفوع
                            </Badge>
                          ) : (
                            <Badge variant="destructive">غير مدفوع</Badge>
                          )
                        ) : (
                          <Badge variant="secondary">لم تبدأ بعد</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> سجل الدفعات
        </h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {summary.paymentHistory.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                لا توجد دفعات مسجلة
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الفترة</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>سجله</TableHead>
                    {isAdmin && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.paymentHistory.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{fmtDate(p.date)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {fmtMoney(p.amount, p.currencySymbol)}
                        </div>
                        {p.amountInDefault !== p.amount && (
                          <div className="text-xs text-muted-foreground">
                            ≈ {fmtMoney(p.amountInDefault, symbol)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.month ? monthLabel(p.month) : "—"}
                      </TableCell>
                      <TableCell>
                        {p.method != null
                          ? paymentMethodLabels[p.method as PaymentMethod]
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[p.status]}>
                          {paymentStatusLabels[p.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.recordedByName ?? "—"}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {p.status === PaymentStatus.PAID && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setReverseTarget(p.id)}
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {payOpen && (
        <PayTutorDialog
          tutorId={tutorId}
          tutorName={tutorName}
          currencySymbol={symbol}
          periods={summary.byPeriod}
          open
          onOpenChange={setPayOpen}
          onSuccess={refresh}
        />
      )}
      {reverseTarget != null && (
        <ReversePaymentDialog
          expenseId={reverseTarget}
          open
          onOpenChange={(o) => {
            if (!o) setReverseTarget(null);
          }}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
