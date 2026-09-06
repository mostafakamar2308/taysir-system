"use client";

import { useEffect, useState, useCallback } from "react";
import { getAcademyStudentFinancialRows } from "@/actions/studentFinances";
import type { AcademyStudentFinancialRow } from "@/lib/studentFinancesLoader";
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
import { AlertTriangle, MessageSquare, SendHorizonal } from "lucide-react";
import SendBulkMessagesDialog from "../../common/SendBulkMessagesDialog";

interface DebtsTabProps {
  defaultCurrency: { code: string; symbol: string };
  studentId?: number;
}

export default function DebtsTab({
  defaultCurrency,
  studentId,
}: DebtsTabProps) {
  const [debts, setDebts] = useState<AcademyStudentFinancialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPhones, setBulkPhones] = useState<{ phone: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAcademyStudentFinancialRows();
      const rows = res.ok ? res.data ?? [] : [];
      const filtered = rows
        .filter((r) => r.overdueAmount > 0)
        .filter((r) => (studentId ? r.studentId === studentId : true))
        .sort(
          (a, b) =>
            (a.daysLeft ?? Number.MAX_SAFE_INTEGER) -
            (b.daysLeft ?? Number.MAX_SAFE_INTEGER),
        );
      setDebts(filtered);
    } catch {
      toast.error("حدث خطأ أثناء جلب المستحقات");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

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
          <AlertTriangle className="h-5 w-5 text-red-500" /> مستحقات الطلاب
        </CardTitle>
        {!loading && debts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openBulkDialog(debts.map((r) => r.phone))}
          >
            <SendHorizonal className="h-4 w-4 ml-1" /> تواصل مع الكل
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : debts.length === 0 ? (
          <p className="text-muted-foreground text-sm">لا توجد مستحقات</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>المجموعة / الخطة</TableHead>
                  <TableHead>المستحق الآن</TableHead>
                  <TableHead>إجمالي غير المسدد</TableHead>
                  <TableHead>الحصص</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((r) => (
                  <TableRow key={r.subId}>
                    <TableCell>{r.studentName}</TableCell>
                    <TableCell>
                      {r.groupTitle}
                      {r.planTitle ? ` – ${r.planTitle}` : ""}
                    </TableCell>
                    <TableCell className="font-mono text-red-600">
                      {formatCurrency(
                        r.overdueAmount,
                        defaultCurrency.symbol,
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(r.outstanding, defaultCurrency.symbol)}
                    </TableCell>
                    <TableCell>
                      {r.sessionCount != null ? (
                        <Badge
                          variant={
                            r.sessionsExhausted ? "destructive" : "secondary"
                          }
                        >
                          {r.sessionsUsed}/{r.sessionCount}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {r.phone && (
                          <a
                            href={`https://wa.me/${r.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-4 w-4 ml-1" /> واتساب
                            </Button>
                          </a>
                        )}
                        <a href={`/ar/dashboard/students/${r.studentId}`}>
                          <Button size="sm" variant="outline">
                            تسجيل دفعة
                          </Button>
                        </a>
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
