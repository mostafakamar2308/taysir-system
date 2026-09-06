"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getOverdueRevenue,
  markRevenueAsPaid,
  OverdueRevenueItem,
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
import { CheckCircle, Clock, MessageSquare, SendHorizonal } from "lucide-react";
import { paymentMethodLabels } from "@/lib/enums";
import { PaymentMethod } from "@/types/payment";
import SendBulkMessagesDialog from "../../common/SendBulkMessagesDialog";

interface OverdueTabProps {
  academyId: number;
  defaultCurrency: { code: string; symbol: string };
  period: "all" | "year" | "month";
  year: number;
  month: number;
  studentId?: number;
}

const getPaymentMethodLabel = (m?: number | null) => {
  if (m === undefined || m === null) return "—";
  return paymentMethodLabels[m as PaymentMethod] || `طريقة ${m}`;
};

export default function OverdueTab({
  academyId,
  defaultCurrency,
  period,
  year,
  month,
  studentId,
}: OverdueTabProps) {
  const [overdueRevenue, setOverdueRevenue] = useState<OverdueRevenueItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPhones, setBulkPhones] = useState<{ phone: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOverdueRevenue(
        academyId,
        period,
        year,
        month,
        studentId,
      );
      setOverdueRevenue(res.ok ? res.data ?? [] : []);
    } catch {
      toast.error("حدث خطأ أثناء جلب الفواتير المتأخرة");
    } finally {
      setLoading(false);
    }
  }, [academyId, period, year, month, studentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleMarkAsPaid = async (revenueId: number) => {
    try {
      await markRevenueAsPaid(revenueId);
      toast.success("تم تحديث الحالة إلى مدفوعة");
      void fetchData();
    } catch {
      toast.error("فشل في تحديث الحالة");
    }
  };

  const openBulkDialog = (phones: (string | null)[]) => {
    const validPhones = phones
      .filter((p): p is string => !!p)
      .map((p) => ({ phone: p }));
    if (validPhones.length === 0) {
      toast.error("لا يوجد أرقام هواتف متاحة");
      return;
    }
    setBulkPhones(validPhones);
    setBulkOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" /> فواتير مسجلة متأخرة
        </CardTitle>
        {!loading && overdueRevenue.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openBulkDialog(overdueRevenue.map((r) => r.studentPhone))
            }
          >
            <SendHorizonal className="h-4 w-4 ml-1" /> تواصل مع الكل
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : overdueRevenue.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            لا توجد فواتير مسجلة متأخرة
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>الخطة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueRevenue.map((rev) => (
                  <TableRow key={rev.id}>
                    <TableCell>{rev.studentName}</TableCell>
                    <TableCell>{rev.planName || "—"}</TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(
                        rev.defaultAmount,
                        defaultCurrency.symbol,
                      )}
                    </TableCell>
                    <TableCell>{rev.dueDate}</TableCell>
                    <TableCell>{getPaymentMethodLabel(rev.method)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(rev.id)}
                        >
                          <CheckCircle className="h-4 w-4 ml-1" /> دفع
                        </Button>
                        {rev.studentPhone && (
                          <a
                            href={`https://wa.me/${rev.studentPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-4 w-4 ml-1" /> واتساب
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {bulkOpen && (
        <SendBulkMessagesDialog
          open={bulkOpen}
          setOpen={setBulkOpen}
          users={bulkPhones}
        />
      )}
    </Card>
  );
}
