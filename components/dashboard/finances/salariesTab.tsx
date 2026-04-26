"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { calculateSalaries, payRemainingSalary } from "@/actions/expense";
import { formatCurrency } from "@/lib/finances";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SalaryCalculation {
  tutorId: number;
  tutorName: string;
  sessionsCount: number;
  pricePerSession: number;
  total: number;
  paid: number;
  remaining: number;
  currencyId: number;
}

interface SalariesTabProps {
  academyId: number;
}

export default function SalariesTab({ academyId }: SalariesTabProps) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salaries, setSalaries] = useState<SalaryCalculation[]>([]);
  const [loading, setLoading] = useState(false);

  const [payDialog, setPayDialog] = useState<{
    open: boolean;
    tutorId: number;
    tutorName: string;
    amount: number;
  }>({ open: false, tutorId: 0, tutorName: "", amount: 0 });
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await calculateSalaries(month, academyId);
      setSalaries(data);
    } catch (error) {
      if (error instanceof Error)
        toast({ title: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [month, academyId]);

  useEffect(() => {
    fetchSalaries();
  }, [month, fetchSalaries]);

  const grandTotal = salaries.reduce((sum, s) => sum + s.total, 0);
  const grandPaid = salaries.reduce((sum, s) => sum + s.paid, 0);
  const grandRemaining = salaries.reduce((sum, s) => sum + s.remaining, 0);

  const handleRefresh = () => {
    fetchSalaries();
  };

  const openPayDialog = (tutor: SalaryCalculation) => {
    setPayDialog({
      open: true,
      tutorId: tutor.tutorId,
      tutorName: tutor.tutorName,
      amount: tutor.remaining,
    });
    setPayAmount(tutor.remaining.toString());
    setPayNotes("");
  };

  const handlePayRemaining = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast({ title: "الرجاء إدخال مبلغ صحيح", variant: "destructive" });
      return;
    }
    if (parseFloat(payAmount) > payDialog.amount) {
      toast({
        title: "المبلغ المدفوع لا يمكن أن يزيد عن المتبقي",
        variant: "destructive",
      });
      return;
    }
    setPayLoading(true);
    try {
      await payRemainingSalary(
        payDialog.tutorId,
        month,
        parseFloat(payAmount),
        payNotes || undefined,
      );
      toast({ title: "تم تسجيل الدفعة" });
      setPayDialog({ open: false, tutorId: 0, tutorName: "", amount: 0 });
      setPayAmount("");
      setPayNotes("");
      await fetchSalaries();
    } catch (error) {
      if (error instanceof Error)
        toast({ title: error.message, variant: "destructive" });
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                الشهر:
              </span>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-45"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              تحديث الحساب
            </Button>
            <div className="mr-auto text-sm text-muted-foreground">
              الإجمالي:{" "}
              <span className="font-bold text-foreground">
                {formatCurrency(grandTotal)}
              </span>
              {" | "}
              المدفوع:{" "}
              <span className="font-bold text-green-600">
                {formatCurrency(grandPaid)}
              </span>
              {" | "}
              المتبقي:{" "}
              <span className="font-bold text-amber-600">
                {formatCurrency(grandRemaining)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المعلم</TableHead>
                  <TableHead>عدد الحصص المكتملة</TableHead>
                  <TableHead>سعر الحصة</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>المتبقي</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد بيانات لهذا الشهر
                    </TableCell>
                  </TableRow>
                ) : (
                  salaries.map((s) => (
                    <TableRow key={s.tutorId}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/tutors/${s.tutorId}`}
                          className="text-primary hover:underline"
                        >
                          {s.tutorName}
                        </Link>
                      </TableCell>
                      <TableCell>{s.sessionsCount} حصة</TableCell>
                      <TableCell>{formatCurrency(s.pricePerSession)}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(s.total)}
                      </TableCell>
                      <TableCell>{formatCurrency(s.paid)}</TableCell>
                      <TableCell className="font-bold text-amber-600">
                        {formatCurrency(s.remaining)}
                      </TableCell>
                      <TableCell>
                        {s.remaining > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPayDialog(s)}
                          >
                            <DollarSign className="h-4 w-4 ml-1" />
                            صرف المتبقي
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pay Remaining Dialog */}
      <AlertDialog
        open={payDialog.open}
        onOpenChange={(open) => setPayDialog({ ...payDialog, open })}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تسديد الراتب المتبقي</AlertDialogTitle>
            <AlertDialogDescription>
              المعلم: <span className="font-medium">{payDialog.tutorName}</span>
              <br />
              إجمالي الراتب المستحق:{" "}
              {formatCurrency(
                (salaries.find((s) => s.tutorId === payDialog.tutorId)?.paid ||
                  0) + payDialog.amount,
              )}
              <br />
              المتبقي: {formatCurrency(payDialog.amount)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <div>
              <label className="text-sm font-medium">المبلغ المراد دفعه</label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="المبلغ"
                step="0.01"
                min="0"
                max={payDialog.amount}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <Textarea
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                rows={2}
                placeholder="ملاحظات إضافية..."
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={payLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePayRemaining}
              disabled={payLoading}
            >
              {payLoading ? "جاري الحفظ..." : "تسجيل الدفعة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
