"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getExpensesKPIs,
  getPendingExpenses,
  getExpensesHistory,
  markExpenseAsPaid,
  updateExpense,
  ExpensesKPIs,
  PendingExpense,
  ExpenseHistoryItem,
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/finances";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Edit, Clock } from "lucide-react";
import { paymentStatusLabels, paymentMethodLabels } from "@/lib/enums";
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
import { PaymentStatus } from "@/types/payment";

interface ExpensesTabProps {
  academyId: number;
  defaultCurrency: { code: string; symbol: string };
  period: "all" | "year" | "month";
  year: number;
  month: number;
  costCenters: { id: number; title: string }[];
  tutors: { id: number; name: string }[];
}

// Edit Expense Dialog
function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
  costCenters,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseHistoryItem;
  onSuccess: () => void;
  costCenters: { id: number; title: string }[];
}) {
  const [amount, setAmount] = useState(expense.amount.toString());
  const [status, setStatus] = useState(expense.status.toString());
  const [method, setMethod] = useState((expense.method ?? 0).toString());
  const [date, setDate] = useState(expense.date);
  const [description, setDescription] = useState(expense.description);
  const [costCenter, setCostCenter] = useState(expense.costCenter || "");
  const [notes, setNotes] = useState(expense.notes || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(expense.amount.toString());
      setStatus(expense.status.toString());
      setMethod((expense.method ?? 0).toString());
      setDate(expense.date);
      setDescription(expense.description);
      setCostCenter(expense.costCenter || "");
      setNotes(expense.notes || "");
    }
  }, [open, expense]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateExpense(expense.id, {
        amount: parseFloat(amount),
        status: parseInt(status),
        method: parseInt(method),
        date,
        description,
        costCenterId:
          costCenters.find((c) => c.title === costCenter)?.id || undefined,
        notes: notes || undefined,
      });
      toast.success("تم تحديث المصروف بنجاح");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("فشل في تحديث المصروف");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل المصروف</DialogTitle>
          <DialogDescription>{expense.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>الوصف</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>المبلغ</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentStatusLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>طريقة الدفع</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>مركز التكلفة</Label>
            <Input
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              placeholder="مثال: إيجار، رواتب"
            />
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main ExpensesTab
export default function ExpensesTab({
  academyId,
  defaultCurrency,
  period,
  year,
  month,
  costCenters,
}: ExpensesTabProps) {
  // Optional cost center filter
  const [costCenterFilter, setCostCenterFilter] = useState<"all" | number>(
    "all",
  );

  const [kpis, setKpis] = useState<ExpensesKPIs | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [history, setHistory] = useState<ExpenseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [editExpense, setEditExpense] = useState<ExpenseHistoryItem | null>(
    null,
  );

  const costCenterParam =
    costCenterFilter === "all" ? undefined : costCenterFilter;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpisData, pendingData, historyData] = await Promise.all([
        getExpensesKPIs(academyId, period, year, month),
        getPendingExpenses(academyId, period, year, month, costCenterParam),
        getExpensesHistory(academyId, period, year, month, costCenterParam),
      ]);
      setKpis(kpisData);
      setPendingExpenses(pendingData);
      setHistory(historyData);
    } catch {
      toast.error("حدث خطأ أثناء جلب بيانات المصروفات");
    } finally {
      setLoading(false);
    }
  }, [academyId, period, year, month, costCenterParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkAsPaid = async (expenseId: number) => {
    try {
      await markExpenseAsPaid(expenseId);
      toast.success("تم تحديث الحالة إلى مدفوعة");
      fetchData();
    } catch {
      toast.error("فشل في تحديث الحالة");
    }
  };

  const handleEditSuccess = () => {
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Cost Center Filter */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">مركز التكلفة</label>
          <Select
            value={costCenterFilter.toString()}
            onValueChange={(val) =>
              setCostCenterFilter(val === "all" ? val : Number(val))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل المراكز" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المراكز</SelectItem>
              {costCenters.map((cc) => (
                <SelectItem key={cc.id} value={cc.id.toString()}>
                  {cc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="block"
          onClick={() => setCostCenterFilter("all")}
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
          : kpis && (
              <>
                <KPICard
                  title="إجمالي المصروفات"
                  value={kpis.totalExpenses}
                  symbol={defaultCurrency.symbol}
                  variant="danger"
                />
                <KPICard
                  title="تكلفة الجلسة"
                  value={kpis.costPerSession}
                  symbol={defaultCurrency.symbol}
                />
                <KPICard
                  title="تكلفة الطالب المشترك"
                  value={kpis.costPerStudentSubscribed}
                  symbol={defaultCurrency.symbol}
                />
              </>
            )}
      </div>

      {/* Expenses per Cost Center & Top Expenses side by side */}
      {!loading && kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>المصروفات حسب المركز</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.expensesPerCostCenter.map((cc) => (
                <div key={cc.costCenter} className="flex justify-between">
                  <span>{cc.costCenter}</span>
                  <span className="font-mono">
                    {formatCurrency(cc.total, defaultCurrency.symbol)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>أعلى المصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              {kpis.topExpenses.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا توجد مصروفات</p>
              ) : (
                <ul className="space-y-2">
                  {kpis.topExpenses.map((exp) => (
                    <li key={exp.id} className="flex justify-between text-sm">
                      <span className="truncate max-w-50">
                        {exp.description}
                      </span>
                      <span className="font-mono ml-2">
                        {formatCurrency(exp.amount, defaultCurrency.symbol)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" /> المصروفات المعلقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : pendingExpenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              لا توجد مصروفات معلقة
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>مركز التكلفة</TableHead>
                    <TableHead>المعلم</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingExpenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>{exp.description}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(
                          exp.defaultAmount,
                          defaultCurrency.symbol,
                        )}
                      </TableCell>
                      <TableCell>{exp.date}</TableCell>
                      <TableCell>{exp.costCenter || "—"}</TableCell>
                      <TableCell>{exp.tutorName || "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(exp.id)}
                        >
                          <CheckCircle className="h-4 w-4 ml-1" /> دفع
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses History */}
      <Card>
        <CardHeader>
          <CardTitle>سجل المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-60 w-full" />
          ) : history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              لا توجد مصروفات في هذه الفترة
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>العملة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>مركز التكلفة</TableHead>
                    <TableHead>تعديل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="max-w-45 truncate">
                        {exp.description}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(
                          exp.defaultAmount,
                          defaultCurrency.symbol,
                        )}
                      </TableCell>
                      <TableCell>{exp.currency}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exp.status === 1
                              ? "default"
                              : exp.status === 0
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {paymentStatusLabels[exp.status as PaymentStatus] ||
                            "غير معروف"}
                        </Badge>
                      </TableCell>
                      <TableCell>{exp.date}</TableCell>
                      <TableCell>{exp.costCenter || "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditExpense(exp)}
                        >
                          <Edit className="h-4 w-4 ml-1" /> تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Expense Dialog */}
      {editExpense && (
        <EditExpenseDialog
          open={!!editExpense}
          onOpenChange={(open) => {
            if (!open) setEditExpense(null);
          }}
          costCenters={costCenters}
          expense={editExpense}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

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
  const color =
    variant === "danger"
      ? "text-red-600"
      : variant === "success"
        ? "text-green-600"
        : "";
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
