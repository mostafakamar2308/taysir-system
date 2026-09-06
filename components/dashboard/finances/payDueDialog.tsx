"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getStudentMonthlyFinance,
  payStudentMonthly,
  StudentMonthlyFinance,
} from "@/actions/finances";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { paymentMethodLabels } from "@/lib/enums";
import { PaymentMethod } from "@/types/payment";
import { formatCurrency } from "@/lib/finances";
import { RefreshCw, Wallet } from "lucide-react";
import { StudentCombobox } from "./studentCombobox";

interface PayDueDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  defaultCurrency: { code: string; symbol: string };
  students: { id: number; name: string | null }[];
  initialYear?: number;
  initialMonth?: number;
  onSuccess?: () => void;
}

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export default function PayDueDialog({
  open,
  onOpenChange,
  trigger,
  defaultCurrency,
  students,
  initialYear,
  initialMonth,
  onSuccess,
}: PayDueDialogProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selfOpen, setSelfOpen] = useState(false);
  const openState = open ?? selfOpen;
  const setOpenState = (v: boolean) => {
    if (open !== undefined) onOpenChange?.(v);
    else setSelfOpen(v);
  };

  const [studentId, setStudentId] = useState<string>("");
  const [year, setYear] = useState<number>(initialYear ?? currentYear);
  const [month, setMonth] = useState<number>(initialMonth ?? currentMonth);
  const [data, setData] = useState<StudentMonthlyFinance | null>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<string>(PaymentMethod.CASH.toString());
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const studentIdNum =
    studentId && studentId !== "all" ? parseInt(studentId) : undefined;
  const years = Array.from(
    { length: 5 },
    (_, i) => currentYear - 2 + i,
  );

  const symbol =
    data?.defaultCurrency.symbol || defaultCurrency.symbol;

  const fetchData = useCallback(async () => {
    if (!studentIdNum) {
      setData(null);
      return;
    }
    await new Promise((r) => setTimeout(r, 0));
    setLoading(true);
    try {
      const res = await getStudentMonthlyFinance(
        studentIdNum,
        year,
        month,
      );
      if (res.ok) {
        setData(res.data);
        setAmount(res.data.remaining.toFixed(2));
      } else {
        setData(null);
        toast.error(res.error ?? "حدث خطأ أثناء جلب البيانات");
      }
    } catch {
      setData(null);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [studentIdNum, year, month]);

  useEffect(() => {
    if (openState && studentIdNum) {
      const id = window.setTimeout(() => {
        void fetchData();
      }, 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openState, studentIdNum, year, month]);

  const handlePay = async () => {
    if (!studentIdNum || !data) return;
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error("أدخل مبلغًا صحيحًا");
      return;
    }
    setPaying(true);
    try {
      const res = await payStudentMonthly(studentIdNum, year, month, {
        amount: val,
        method: parseInt(method),
      });
      if (res.ok) {
        toast.success("تم تسجيل الدفعة بنجاح");
        onSuccess?.();
        setOpenState(false);
        setData(null);
      } else {
        toast.error(res.error ?? "فشل في تسجيل الدفعة");
      }
    } catch {
      toast.error("فشل في تسجيل الدفعة");
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" /> دفع مستحقات
          </DialogTitle>
          <DialogDescription>
            اختر الطالب والشهر لعرض الحصص والمبالغ المحسوبة لهذا الشهر.
          </DialogDescription>
        </DialogHeader>

        {/* Selection row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>الطالب</Label>
            <StudentCombobox
              students={students}
              value={studentId}
              onChange={setStudentId}
              placeholder="اختر طالبًا..."
            />
          </div>
          <div className="space-y-1">
            <Label>السنة</Label>
            <Select
              value={year.toString()}
              onValueChange={(v) => setYear(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>الشهر</Label>
            <Select
              value={month.toString()}
              onValueChange={(v) => setMonth(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchData()}
            disabled={!studentIdNum || loading}
          >
            <RefreshCw className="h-4 w-4 ml-1" /> إعادة حساب
          </Button>
        </div>

        {/* Monthly breakdown */}
        {!studentIdNum ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            اختر طالبًا لعرض البيانات المالية للشهر.
          </p>
        ) : loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold">
              {data.studentName} - {MONTHS[data.month - 1]} {data.year}
            </div>

            {data.groups.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                لا توجد حصص أو اشتراكات لهذا الطالب في هذا الشهر.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-right font-medium">
                        المجموعة
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        الحصص
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        شهري
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        إضافي
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        المستحق
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map((g) => (
                      <tr key={g.groupId} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium">{g.groupTitle}</div>
                          {g.planTitle && (
                            <div className="text-xs text-muted-foreground">
                              {g.planTitle}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              خاص {g.privateSessions}
                            </span>
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                              مجموعة {g.groupSessions}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({g.totalSessions})
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {formatCurrency(g.subscriptionPrice, symbol)}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {formatCurrency(g.extraSessionsCost, symbol)}
                        </td>
                        <td className="px-3 py-2 font-mono font-medium text-red-600">
                          {formatCurrency(g.due, symbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المستحق للشهر</span>
                <span className="font-mono">
                  {formatCurrency(data.totalDue, symbol)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المدفوع</span>
                <span className="font-mono text-green-600">
                  {formatCurrency(data.totalPaid, symbol)}
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>المتبقي</span>
                <span className="font-mono text-red-600">
                  {formatCurrency(data.remaining, symbol)}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>طريقة الدفع</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(
                      ([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>المبلغ</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {studentIdNum && data && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenState(false)}>
              إلغاء
            </Button>
            <Button onClick={handlePay} disabled={paying || data.remaining <= 0}>
              تأكيد الدفع
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}