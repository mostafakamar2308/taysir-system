"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getRenewalSubscriptions,
  createRevenueForSubscription,
  RenewalSubscription,
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
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  SendHorizonal,
} from "lucide-react";
import SendBulkMessagesDialog from "../../common/SendBulkMessagesDialog";

interface RenewalsTabProps {
  academyId: number;
  defaultCurrency: { code: string; symbol: string };
  studentId?: number;
}

type RenewalsData = {
  upcoming: RenewalSubscription[];
  overdue: RenewalSubscription[];
};

function RenewalTable({
  rows,
  symbol,
  onPay,
}: {
  rows: RenewalSubscription[];
  symbol: string;
  onPay: (id: number) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الطالب</TableHead>
          <TableHead>الخطة</TableHead>
          <TableHead>تاريخ الانتهاء</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((sub) => (
          <TableRow key={sub.id}>
            <TableCell>
              {sub.studentName}
              {sub.sessionsExhausted && (
                <Badge variant="destructive" className="mr-2 align-middle">
                  نفدت الحصص
                </Badge>
              )}
            </TableCell>
            <TableCell>{sub.planName}</TableCell>
            <TableCell>{sub.endDate}</TableCell>
            <TableCell className="font-mono">
              {formatCurrency(sub.planPrice, symbol)}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPay(sub.id)}
                >
                  <CheckCircle className="h-4 w-4 ml-1" /> دفع
                </Button>
                {sub.studentPhone && (
                  <a
                    href={`https://wa.me/${sub.studentPhone}`}
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
  );
}

export default function RenewalsTab({
  academyId,
  defaultCurrency,
  studentId,
}: RenewalsTabProps) {
  const [renewals, setRenewals] = useState<RenewalsData>({
    upcoming: [],
    overdue: [],
  });
  const [loading, setLoading] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPhones, setBulkPhones] = useState<{ phone: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRenewalSubscriptions(academyId);
      const data = res.ok
        ? res.data ?? { upcoming: [], overdue: [] }
        : { upcoming: [], overdue: [] };
      const filterByStudent = (rows: RenewalSubscription[]) =>
        studentId ? rows.filter((r) => r.studentId === studentId) : rows;
      setRenewals({
        upcoming: filterByStudent(data.upcoming),
        overdue: filterByStudent(data.overdue),
      });
    } catch {
      toast.error("حدث خطأ أثناء جلب الاشتراكات");
    } finally {
      setLoading(false);
    }
  }, [academyId, studentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleMarkRenewalAsPaid = async (subscriptionId: number) => {
    try {
      await createRevenueForSubscription(subscriptionId);
      toast.success("تم إنشاء الإيراد وتجديد الاشتراك");
      void fetchData();
    } catch {
      toast.error("فشل في إنشاء الإيراد");
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

  const empty = renewals.upcoming.length === 0 && renewals.overdue.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" /> تجديد الاشتراكات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : empty ? (
          <p className="text-muted-foreground text-sm">
            لا توجد اشتراكات قريبة الانتهاء
          </p>
        ) : (
          <div className="space-y-6">
            {renewals.upcoming.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-green-600">
                    قادمة (خلال 7 أيام)
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openBulkDialog(
                        renewals.upcoming.map((s) => s.studentPhone),
                      )
                    }
                  >
                    <SendHorizonal className="h-4 w-4 ml-1" /> تواصل مع الكل
                  </Button>
                </div>
                <RenewalTable
                  rows={renewals.upcoming}
                  symbol={defaultCurrency.symbol}
                  onPay={handleMarkRenewalAsPaid}
                />
              </div>
            )}
            {renewals.overdue.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-red-600">فائتة</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openBulkDialog(
                        renewals.overdue.map((s) => s.studentPhone),
                      )
                    }
                  >
                    <SendHorizonal className="h-4 w-4 ml-1" /> تواصل مع الكل
                  </Button>
                </div>
                <RenewalTable
                  rows={renewals.overdue}
                  symbol={defaultCurrency.symbol}
                  onPay={handleMarkRenewalAsPaid}
                />
              </div>
            )}
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