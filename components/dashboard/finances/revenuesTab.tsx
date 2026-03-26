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
  CheckCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deletePayment, markPaymentAsPaid } from "@/actions/payment";
import {
  paymentStatusLabels,
  paymentStatusColors,
  paymentMethodLabels,
  formatCurrency,
  formatDate,
} from "@/lib/finances";
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
import { PaymentStatus } from "@/types/payment";
import { PaymentRecord, PlanOption, StudentOption } from "@/types/finances";
import RevenueFormDialog from "./revenueFormDialog";

interface RevenuesTabProps {
  payments: PaymentRecord[];
  setPayments: (payments: PaymentRecord[]) => void;
  students: StudentOption[];
  plans: PlanOption[];
  academyId: number;
  currencies: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  }[];
  defaultCurrency: { code: string; symbol: string; name: string };
}

export default function RevenuesTab({
  payments,
  students,
  plans,
  academyId,
  currencies,
  defaultCurrency,
}: RevenuesTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (
        search &&
        !p.studentName.includes(search) &&
        !(p.description || "").includes(search)
      )
        return false;
      if (statusFilter !== "all" && p.status !== parseInt(statusFilter))
        return false;
      if (methodFilter !== "all" && p.method !== parseInt(methodFilter))
        return false;
      if (dateFrom && p.date < dateFrom) return false;
      if (dateTo && p.date > dateTo) return false;
      return true;
    });
  }, [payments, search, statusFilter, methodFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (deleteId) {
      await deletePayment(deleteId);
      setDeleteId(null);
      router.refresh();
    }
  };

  const handleMarkPaid = async (id: number) => {
    await markPaymentAsPaid(id);
    router.refresh();
  };

  const exportCSV = () => {
    const headers = [
      "التاريخ",
      "الطالب",
      "الوصف",
      "المبلغ (" + defaultCurrency.code + ")",
      "طريقة الدفع",
      "الحالة",
    ];
    const rows = filtered.map((p) => [
      p.date,
      p.studentName,
      p.description || "",
      p.amountInDefault,
      p.method !== null ? paymentMethodLabels[p.method] : "",
      paymentStatusLabels[p.status],
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "revenues.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم التصدير" });
  };

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
                placeholder="بحث بالاسم أو الوصف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32.5">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(paymentStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-32.5">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(paymentMethodLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-35"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="من"
            />
            <Input
              type="date"
              className="w-35"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="إلى"
            />
            <Button
              onClick={() => {
                setEditingPayment(null);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة إيراد
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
                  <TableHead>الطالب</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الفاتورة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد إيرادات
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(p.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.studentName}
                      </TableCell>
                      <TableCell>{p.description || "-"}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(
                          p.amountInDefault,
                          defaultCurrency.code,
                        )}
                      </TableCell>
                      <TableCell>
                        {p.method !== null
                          ? paymentMethodLabels[p.method]
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {p.invoiceUrl ? (
                          <a
                            href={p.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> عرض
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[p.status]}>
                          {paymentStatusLabels[p.status]}
                        </Badge>
                      </TableCell>
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
                                setEditingPayment(p);
                                setFormOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Pencil className="h-4 w-4" /> تعديل
                            </DropdownMenuItem>
                            {p.status === PaymentStatus.PENDING && (
                              <DropdownMenuItem
                                onClick={() => handleMarkPaid(p.id)}
                                className="gap-2"
                              >
                                <CheckCircle className="h-4 w-4" /> تحديد كمدفوع
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeleteId(p.id)}
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

      <RevenueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingPayment={editingPayment}
        students={students}
        plans={plans}
        currencies={currencies}
        academyId={academyId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الإيراد</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الإيراد؟ لا يمكن التراجع عن هذا الإجراء.
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
