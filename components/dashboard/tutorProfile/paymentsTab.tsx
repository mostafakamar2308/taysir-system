"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TutorProfile } from "@/types/tutor";
import { paymentStatusColors, paymentStatusLabels } from "@/lib/enums";
import PayTutorDialog from "@/components/dashboard/dialogs/payTutorDialog";

interface PaymentsTabProps {
  tutor: TutorProfile;
  currencies: { id: number; name: string }[];
}

export default function PaymentsTab({ tutor, currencies }: PaymentsTabProps) {
  const { toast } = useToast();
  const { totalEarnings, paid, pending } = tutor.monthlyStats;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              إجمالي مستحقات الشهر
            </p>
            <p className="text-2xl font-bold text-primary">
              {totalEarnings} {tutor.currency}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">تم الدفع</p>
            <p className="text-2xl font-bold text-green-600">
              {paid} {tutor.currency}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">متبقي</p>
            <p className="text-2xl font-bold text-amber-600">
              {pending > 0 ? `${pending} ${tutor.currency}` : `لا يوجد باقي`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">سجل المدفوعات (هذا الشهر)</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast({ title: "تصدير التقرير" })}
            >
              <Download className="h-4 w-4 ml-2" /> تصدير
            </Button>
            <PayTutorDialog
              academyId={tutor.academyId}
              tutorId={tutor.id}
              tutorName={tutor.name}
              currencies={currencies}
              currencyId={tutor.currencyId}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutor.payments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-4 text-muted-foreground"
                    >
                      لا توجد مدفوعات مسجلة هذا الشهر
                    </TableCell>
                  </TableRow>
                ) : (
                  tutor.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.date)}</TableCell>
                      <TableCell>{p.description || "راتب شهر"}</TableCell>
                      <TableCell className="font-medium">
                        {p.amount} {p.currency}
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[p.status]}>
                          {paymentStatusLabels[p.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
