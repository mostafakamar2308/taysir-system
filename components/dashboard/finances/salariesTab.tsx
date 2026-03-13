"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, FileText, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { calculateSalaries, generateSalaryExpenses } from "@/actions/expense";
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
import { SalaryCalculation } from "@/types/finances";

interface SalariesTabProps {
  academyId: number;
}

export default function SalariesTab({ academyId }: SalariesTabProps) {
  const router = useRouter();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [salaries, setSalaries] = useState<SalaryCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateNotes, setGenerateNotes] = useState("");

  const monthLabel = new Date(month + "-01").toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
  });

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await calculateSalaries(month);
      setSalaries(data);
    } catch (error) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchSalaries();
  }, [month, fetchSalaries]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === salaries.length) setSelected(new Set());
    else setSelected(new Set(salaries.map((s) => s.tutorId)));
  };

  const ungenerated = salaries.filter((s) => !s.existingExpense);
  const hasExisting = salaries.some((s) => s.existingExpense);
  const totalSelected = salaries
    .filter((s) => selected.has(s.tutorId))
    .reduce((sum, s) => sum + s.total, 0);
  const grandTotal = salaries.reduce((sum, s) => sum + s.total, 0);

  const handleGenerate = async () => {
    const tutorIds = Array.from(selected);
    await generateSalaryExpenses(
      month,
      tutorIds,
      generateNotes || null,
      academyId,
    );
    toast({ title: "تم إنشاء المصروفات" });
    setShowGenerate(false);
    setGenerateNotes("");
    await fetchSalaries();
    setSelected(new Set());
  };

  const handleRefresh = () => {
    fetchSalaries();
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
                className="w-[180px]"
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
            {selected.size > 0 && (
              <Button onClick={() => setShowGenerate(true)} className="gap-2">
                <FileText className="h-4 w-4" /> إنشاء مصروفات الرواتب (
                {selected.size})
              </Button>
            )}
            <div className="mr-auto text-sm text-muted-foreground">
              الإجمالي:{" "}
              <span className="font-bold text-foreground">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasExisting && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent border border-border text-muted-foreground text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>بعض رواتب شهر {monthLabel} تم تسجيلها مسبقاً.</span>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        selected.size === salaries.length && salaries.length > 0
                      }
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>اسم المعلم</TableHead>
                  <TableHead>عدد الحصص</TableHead>
                  <TableHead>سعر الحصة</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>رواتب مسجلة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد بيانات لهذا الشهر
                    </TableCell>
                  </TableRow>
                ) : (
                  salaries.map((s) => (
                    <TableRow key={s.tutorId}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(s.tutorId)}
                          onCheckedChange={() => toggleSelect(s.tutorId)}
                          disabled={!!s.existingExpense}
                        />
                      </TableCell>
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
                      <TableCell>
                        {s.existingExpense ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {formatCurrency(s.existingExpense.amount)}
                            </span>
                            <Badge
                              className={
                                s.existingExpense.paid
                                  ? "bg-primary/10 text-primary"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {s.existingExpense.paid ? "مدفوع" : "غير مدفوع"}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            لم يسجل بعد
                          </span>
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

      {/* Generate Confirmation */}
      <AlertDialog open={showGenerate} onOpenChange={setShowGenerate}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إنشاء مصروفات الرواتب</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إنشاء {selected.size} مصروف راتب لشهر {monthLabel} بإجمالي{" "}
              {formatCurrency(totalSelected)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <span className="text-sm font-medium">ملاحظات (اختياري)</span>
            <Textarea
              value={generateNotes}
              onChange={(e) => setGenerateNotes(e.target.value)}
              rows={2}
              placeholder="ملاحظات إضافية..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>
              إنشاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
