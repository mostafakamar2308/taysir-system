"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { StudentProfile } from "@/types/studentProfile";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import {
  paymentMethodLabels,
  paymentStatusColors,
  paymentStatusLabels,
} from "@/lib/enums";
import dayjs from "@/lib/dayjs";
import ChangePlanDialog from "@/components/dashboard/studentProfile/changePlanDialog";
import RecordPaymentDialog from "@/components/dashboard/studentProfile/dialogs/recordPaymentDialog";
import { SubscriptionStatus } from "@/types/subscription";
import ResolvePaymentDialog from "./dialogs/resolvePaymentDialog";

interface SubscriptionDisplay {
  id: number;
  planId: number;
  planTitle: string;
  planSessionsPerWeek: number;
  planPrice: number;
  planCurrency: string;
  startDate: string;
  endDate: string | null;
  status: number;
  autoRenew: boolean;
  payments: { id: number; amount: number; date: string; status: number }[];
}

interface BillingTabProps {
  student: StudentProfile;
  plans: {
    id: number;
    title: string;
    price: number;
    sessionsPerWeek: number;
    billingPeriod: number;
  }[];
  subscriptions: SubscriptionDisplay[];
}

const subscriptionStatusLabels: Record<number, string> = {
  0: "نشط",
  1: "ملغي",
  2: "منتهي",
  3: "معلق",
};

const subscriptionStatusColors: Record<number, string> = {
  0: "bg-green-100 text-green-700",
  1: "bg-red-100 text-red-700",
  2: "bg-gray-100 text-gray-700",
  3: "bg-amber-100 text-amber-700",
};

export default function BillingTab({
  student,
  plans,
  subscriptions,
}: BillingTabProps) {
  console.log({ student, plans, subscriptions });

  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [resolveDialog, setResolveDialog] = useState<{
    open: boolean;
    payment: {
      id: number;
      amount: number;
      method: number | null;
      invoiceUrl: string | null;
    } | null;
  }>({ open: false, payment: null });

  const activeSubscription = subscriptions.find(
    (s) => s.status === SubscriptionStatus.active,
  );
  const totalEarned = student.payments
    .filter((p) => p.status === PaymentStatus.PAID)
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = student.payments.filter(
    (p) => p.status === PaymentStatus.PENDING,
  );
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate next payment due date
  let nextPaymentDue: string | null = null;
  if (activeSubscription) {
    // Use endDate if present, otherwise calculate from startDate + billingPeriod
    if (activeSubscription.endDate) {
      nextPaymentDue = activeSubscription.endDate;
    } else {
      const plan = plans.find((p) => p.id === activeSubscription.planId);
      if (plan) {
        const start = dayjs(activeSubscription.startDate);
        nextPaymentDue = start.add(plan.billingPeriod, "day").toISOString();
      }
    }
  }

  // Payments this month
  const now = dayjs();
  const paymentsThisMonth = student.payments.filter(
    (p) =>
      dayjs(p.date).isSame(now, "month") && p.status === PaymentStatus.PAID,
  );
  const totalPaidThisMonth = paymentsThisMonth.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  const formatDate = (d: string) => dayjs(d).locale("ar").format("D MMMM YYYY");
  const formatCurrency = (amount: number, currency: string) =>
    `${amount.toLocaleString("ar-EG")} ${currency}`;

  const subscriptionOptions = subscriptions.map((sub) => ({
    id: sub.id,
    planTitle: sub.planTitle,
    startDate: sub.startDate,
  }));

  return (
    <div className="space-y-6 mt-4">
      {/* Financial Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ملخص مالي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  إجمالي الإيرادات
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(totalEarned, student.plan?.currency || "ر.س")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مبالغ مستحقة</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(
                    totalPending,
                    student.plan?.currency || "ر.س",
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الدفعة التالية</p>
                <p className="text-lg font-bold">
                  {nextPaymentDue ? formatDate(nextPaymentDue) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  مدفوعات هذا الشهر
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    totalPaidThisMonth,
                    student.plan?.currency || "ر.س",
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Subscription Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">الاشتراك الحالي</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChangePlanOpen(true)}
          >
            تغيير الخطة
          </Button>
        </CardHeader>
        <CardContent>
          {activeSubscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">الخطة</p>
                  <p className="font-bold text-lg">
                    {activeSubscription.planTitle}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">حصص/أسبوع</p>
                  <p className="font-bold text-lg">
                    {activeSubscription.planSessionsPerWeek}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(
                      activeSubscription.planPrice,
                      activeSubscription.planCurrency,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <Badge
                    className={
                      subscriptionStatusColors[activeSubscription.status]
                    }
                  >
                    {subscriptionStatusLabels[activeSubscription.status]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">تاريخ البدء: </span>
                  <span className="font-medium">
                    {formatDate(activeSubscription.startDate)}
                  </span>
                </div>
                {activeSubscription.endDate && (
                  <div>
                    <span className="text-muted-foreground">
                      تاريخ الانتهاء:{" "}
                    </span>
                    <span className="font-medium">
                      {formatDate(activeSubscription.endDate)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">تجديد تلقائي: </span>
                  <span className="font-medium">
                    {activeSubscription.autoRenew ? "نعم" : "لا"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">لا يوجد اشتراك نشط</p>
              <Button className="mt-4" onClick={() => setChangePlanOpen(true)}>
                <Plus className="h-4 w-4 ml-2" /> إضافة اشتراك
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outstanding Payments (if any) */}
      {totalPending > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  مبالغ مستحقة
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {formatCurrency(
                    totalPending,
                    activeSubscription?.planCurrency || "",
                  )}{" "}
                  بانتظار الدفع
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setRecordPaymentOpen(true)}>
              تسجيل دفعة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">سجل المدفوعات</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecordPaymentOpen(true)}
          >
            <Plus className="h-4 w-4 ml-2" /> تسجيل دفعة
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الاشتراك</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>فاتورة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.payments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-muted-foreground"
                    >
                      لا توجد مدفوعات
                    </TableCell>
                  </TableRow>
                ) : (
                  student.payments.map((p) => {
                    const paymentStatusLabel =
                      paymentStatusLabels[p.status as PaymentStatus];
                    const paymentStatusColor =
                      paymentStatusColors[p.status as PaymentStatus];
                    const paymentMethodLabel = p.method
                      ? paymentMethodLabels[p.method as PaymentMethod]
                      : "—";
                    const subscription = subscriptions.find((s) =>
                      s.payments.some((pay) => pay.id === p.id),
                    );
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.date)}</TableCell>
                        <TableCell>
                          {subscription ? subscription.planTitle : "—"}
                        </TableCell>
                        <TableCell>{p.description || "—"}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(p.amount, p.currency)}
                        </TableCell>
                        <TableCell>{paymentMethodLabel}</TableCell>
                        <TableCell>
                          <Badge className={paymentStatusColor}>
                            {paymentStatusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.status === PaymentStatus.PENDING ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setResolveDialog({
                                  open: true,
                                  payment: {
                                    id: p.id,
                                    amount: p.amount,
                                    method: p.method,
                                    invoiceUrl: p.invoiceUrl,
                                  },
                                })
                              }
                            >
                              تسوية
                            </Button>
                          ) : p.invoiceUrl ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={p.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجل الاشتراكات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الخطة</TableHead>
                    <TableHead>تاريخ البدء</TableHead>
                    <TableHead>تاريخ الانتهاء</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المدفوعات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.planTitle}
                      </TableCell>
                      <TableCell>{formatDate(sub.startDate)}</TableCell>
                      <TableCell>
                        {sub.endDate ? formatDate(sub.endDate) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={subscriptionStatusColors[sub.status]}>
                          {subscriptionStatusLabels[sub.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.payments.length > 0 ? (
                          <div className="space-y-1">
                            {sub.payments.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span>{formatDate(p.date)}</span>
                                <span className="font-mono">{p.amount}</span>
                                <Badge
                                  className={
                                    paymentStatusColors[
                                      p.status as PaymentStatus
                                    ]
                                  }
                                >
                                  {
                                    paymentStatusLabels[
                                      p.status as PaymentStatus
                                    ]
                                  }
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <ChangePlanDialog
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        studentId={student.id}
        plans={plans}
        currentPlanId={student.planId}
      />

      <RecordPaymentDialog
        open={recordPaymentOpen}
        activeSubscriptionId={
          student.subscriptions.find(
            (s) => s.status === SubscriptionStatus.active,
          )?.id
        }
        onOpenChange={setRecordPaymentOpen}
        studentId={student.id}
        subscriptions={subscriptionOptions}
      />
      <ResolvePaymentDialog
        open={resolveDialog.open}
        onOpenChange={(open) => setResolveDialog({ ...resolveDialog, open })}
        payment={resolveDialog.payment}
      />
    </div>
  );
}
