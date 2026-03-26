"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deleteExpense } from "@/actions/expense";
import {
  costCenters,
  paymentMethodLabels,
  formatCurrency,
  formatDate,
} from "@/lib/finances";
import ExpenseFormDialog from "@/components/dashboard/finances/expenseFormDialog";
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
import { ExpenseRecord, TutorOption } from "@/types/finances";

interface ExpensesTabProps {
  expenses: ExpenseRecord[];
  setExpenses: (expenses: ExpenseRecord[]) => void;
  tutors: TutorOption[];
  academyId: number;
  currencies: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  }[];
  defaultCurrency: { code: string; symbol: string; name: string };
}
export default function ExpensesTab({
  expenses,
  tutors,
  academyId,
  currencies,
  defaultCurrency,
}: ExpensesTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [costCenterFilter, setCostCenterFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (
        search &&
        !e.description.includes(search) &&
        !(e.tutorName || "").includes(search)
      )
        return false;
      if (costCenterFilter !== "all" && e.costCenter !== costCenterFilter)
        return false;
      if (paidFilter === "paid" && !e.paid) return false;
      if (paidFilter === "unpaid" && e.paid) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      return true;
    });
  }, [expenses, search, costCenterFilter, paidFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteExpense(deleteId);
      setDeleteId(null);
      router.refresh();
    }
  };

  const exportCSV = () => {
    const headers = [
      "التاريخ",
      "البند",
      "مركز التكلفة",
      "المبلغ (" + defaultCurrency.code + ")",
      "طريقة الدفع",
      "مدفوع",
      "المعلم",
      "ملاحظات",
    ];
    const rows = filtered.map((e) => [
      e.date,
      e.description,
      e.costCenter || "",
      e.amountInDefault,
      e.method !== null ? paymentMethodLabels[e.method] : "",
      e.paid ? "نعم" : "لا",
      e.tutorName || "",
      e.notes || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم التصدير" });
  };

  const isLink = (s: string | null) => s && s.startsWith("http");

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="بحث بالبند أو المعلم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={costCenterFilter}
              onValueChange={setCostCenterFilter}
            >
              <SelectTrigger className="w-35">
                <SelectValue placeholder="مركز التكلفة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {costCenters.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paidFilter} onValueChange={setPaidFilter}>
              <SelectTrigger className="w-30">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="unpaid">غير مدفوع</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-35"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              className="w-35"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Button
              onClick={() => {
                setEditingExpense(null);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة مصروف
            </Button>
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              تصدير
            </Button>
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
                  <TableHead>التاريخ</TableHead>
                  <TableHead>البند</TableHead>
                  <TableHead>مركز التكلفة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>مدفوع؟</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>المعلم</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد مصروفات
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(e.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {e.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{e.costCenter || "-"}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(
                          e.amountInDefault,
                          defaultCurrency.code,
                        )}
                      </TableCell>
                      <TableCell>
                        {e.method !== null
                          ? paymentMethodLabels[e.method]
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            e.paid
                              ? "bg-primary/10 text-primary"
                              : "bg-amber-100 text-amber-700"
                          }
                        >
                          {e.paid ? "نعم" : "لا"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isLink(e.invoiceUrl) ? (
                          <a
                            href={e.invoiceUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> عرض
                          </a>
                        ) : (
                          e.invoiceUrl || "-"
                        )}
                      </TableCell>
                      <TableCell>{e.tutorName || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingExpense(e);
                                setFormOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Pencil className="h-4 w-4" /> تعديل
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem
                              onClick={() => handleTogglePaid(e.id, e.paid)}
                              className="gap-2"
                            >
                              {e.paid ? (
                                <>
                                  <XCircle className="h-4 w-4" /> تحديد كغير
                                  مدفوع
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" /> تحديد
                                  كمدفوع
                                </>
                              )}
                            </DropdownMenuItem> */}
                            <DropdownMenuItem
                              onClick={() => setDeleteId(e.id)}
                              className="gap-2 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" /> حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingExpense={editingExpense}
        currencies={currencies}
        tutors={tutors}
        academyId={academyId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المصروف؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
