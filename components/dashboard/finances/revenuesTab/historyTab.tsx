"use client";

import { useEffect, useState, useCallback } from "react";
import { getRevenueHistory, RevenueHistoryItem } from "@/actions/finances";
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
import { Edit } from "lucide-react";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/enums";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import EditRevenueDialog from "./editRevenueDialog";

interface HistoryTabProps {
  academyId: number;
  defaultCurrency: { code: string; symbol: string };
  period: "all" | "year" | "month";
  year: number;
  month: number;
  studentId?: number;
  method?: number;
}

const getPaymentMethodLabel = (m?: number | null) => {
  if (m === undefined || m === null) return "—";
  return paymentMethodLabels[m as PaymentMethod] || `طريقة ${m}`;
};

const getStatusBadge = (status: number) => {
  const label = paymentStatusLabels[status as PaymentStatus] || "غير معروف";
  return (
    <Badge
      variant={
        status === 1 ? "default" : status === 0 ? "destructive" : "secondary"
      }
    >
      {label}
    </Badge>
  );
};

export default function HistoryTab({
  academyId,
  defaultCurrency,
  period,
  year,
  month,
  studentId,
  method,
}: HistoryTabProps) {
  const [history, setHistory] = useState<RevenueHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRevenue, setEditRevenue] = useState<RevenueHistoryItem | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRevenueHistory(
        academyId,
        period,
        year,
        month,
        studentId,
        method,
      );
      setHistory(res.ok ? res.data ?? [] : []);
    } catch {
      toast.error("حدث خطأ أثناء جلب سجل الإيرادات");
    } finally {
      setLoading(false);
    }
  }, [academyId, period, year, month, studentId, method]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleEditSuccess = () => {
    void fetchData();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل الإيرادات</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-60 w-full" />
        ) : history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            لا توجد إيرادات في هذه الفترة
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>الخطة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>العملة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الطريقة</TableHead>
                  <TableHead>تعديل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((rev) => (
                  <TableRow key={rev.id}>
                    <TableCell>{rev.studentName}</TableCell>
                    <TableCell>{rev.planName || "—"}</TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(
                        rev.defaultAmount,
                        defaultCurrency.symbol,
                      )}
                    </TableCell>
                    <TableCell>{rev.currency}</TableCell>
                    <TableCell>{getStatusBadge(rev.status)}</TableCell>
                    <TableCell>{rev.dueDate}</TableCell>
                    <TableCell>{getPaymentMethodLabel(rev.method)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditRevenue(rev)}
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

      {editRevenue && (
        <EditRevenueDialog
          key={editRevenue.id}
          open={!!editRevenue}
          onOpenChange={(open) => {
            if (!open) setEditRevenue(null);
          }}
          revenue={editRevenue}
          onSuccess={handleEditSuccess}
        />
      )}
    </Card>
  );
}