"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Banknote,
  Calendar,
  Plus,
  RefreshCw,
  Pencil,
  XCircle,
  History,
  CreditCard,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import {
  subscriptionStatusLabels,
  subscriptionStatusColors,
  paymentStatusLabels,
  paymentMethodLabels,
} from "@/lib/enums";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";
import {
  StudentFinancialSummary,
  SubscriptionFinancial,
  SubscriptionCycleState,
} from "@/types/studentFinances";
import RecordPaymentDialog from "./dialogs/recordPaymentDialog";
import AddSubscriptionDialog from "./dialogs/addSubscriptionDialog";
import EditSubscriptionDialog from "./dialogs/editSubscriptionDialog";
import RenewSubscriptionDialog from "./dialogs/renewSubscriptionDialog";
import DeactivateSubscriptionDialog from "./dialogs/deactivateSubscriptionDialog";
import BillingDateDialog from "./dialogs/billingDateDialog";

interface Props {
  studentId: number;
  academyId: number;
  currencyId: number;
  currencySymbol: string;
  summary: StudentFinancialSummary;
}

function fmtMoney(amount: number, symbol: string): string {
  return `${amount.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ${symbol}`;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return dayjs(value).format("D MMM YYYY");
}

const cycleStateMeta: Record<
  SubscriptionCycleState,
  { label: string; className: string }
> = {
  paid: { label: "مدفوع", className: "bg-green-100 text-green-700" },
  upcoming: { label: "قادم", className: "bg-blue-100 text-blue-700" },
  due: { label: "مستحق اليوم", className: "bg-amber-100 text-amber-700" },
  overdue: { label: "متأخر", className: "bg-red-100 text-red-700" },
};

export default function FinancesTab({
  studentId,
  academyId,
  currencyId,
  currencySymbol,
  summary,
}: Props) {
  const router = useRouter();
  const [recordOpen, setRecordOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editSub, setEditSub] = useState<SubscriptionFinancial | null>(null);
  const [renewSub, setRenewSub] = useState<SubscriptionFinancial | null>(null);
  const [deactivateSub, setDeactivateSub] =
    useState<SubscriptionFinancial | null>(null);

  const refresh = () => router.refresh();

  const activeSubs = useMemo(
    () =>
      summary.subscriptions.filter(
        (s) => s.status === SubscriptionStatus.active && s.membershipActive,
      ),
    [summary.subscriptions],
  );

  const inactiveSubs = useMemo(
    () =>
      summary.subscriptions.filter(
        (s) => s.status !== SubscriptionStatus.active || !s.membershipActive,
      ),
    [summary.subscriptions],
  );

  const overdue = summary.overdue;

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {summary.warnings.length > 0 && (
        <div className="space-y-2">
          {summary.warnings.map((w, i) => (
            <Alert
              key={i}
              variant={
                w.type === "danger"
                  ? "destructive"
                  : w.type === "warning"
                    ? "default"
                    : "default"
              }
              className={
                w.type === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : ""
              }
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{w.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Financial summary card */}
      <Card className={overdue > 0 ? "border-red-300" : ""}>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg">الملخص المالي</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 ml-1" /> إضافة اشتراك
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRecordOpen(true)}>
              <Banknote className="h-4 w-4 ml-1" /> تسجيل دفعة
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBillingOpen(true)}>
              <Calendar className="h-4 w-4 ml-1" /> تاريخ الفوترة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
              <div
                className={`text-4xl font-bold ${
                  overdue > 0 ? "text-red-600" : ""
                }`}
              >
                {fmtMoney(summary.totalDue, summary.defaultCurrency.symbol)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {overdue > 0 ? (
                  <Badge variant="destructive">
                    متأخر: {fmtMoney(overdue, summary.defaultCurrency.symbol)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">
                    مستحق في {fmtDate(summary.billingDate)}
                  </span>
                )}
                <span className="text-muted-foreground">
                  تاريخ الفوترة: {fmtDate(summary.billingDate)}{" "}
                  {summary.billingDateSource === "custom" && (
                    <Badge variant="secondary">مخصص</Badge>
                  )}
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-md border p-3 min-w-56">
              <p className="text-sm font-medium mb-2">تفاصيل المبلغ</p>
              <div className="space-y-1 text-sm">
                {activeSubs.length === 0 && (
                  <p className="text-muted-foreground">لا اشتراكات نشطة</p>
                )}
                {activeSubs.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between"
                  >
                    <span>{s.groupTitle}</span>
                    <span className="font-medium">
                      {fmtMoney(s.price, s.currencySymbol)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-1 mt-1 font-semibold">
                  <span>الإجمالي</span>
                  <span>{fmtMoney(summary.totalDue, summary.defaultCurrency.symbol)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold">
                {fmtMoney(summary.totalPaidHistorical, summary.defaultCurrency.symbol)}
              </div>
              <div className="text-xs text-muted-foreground">إجمالي المدفوعات</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold">
                {fmtMoney(summary.outstanding, summary.defaultCurrency.symbol)}
              </div>
              <div className="text-xs text-muted-foreground">المتبقي</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold text-red-600">
                {fmtMoney(overdue, summary.defaultCurrency.symbol)}
              </div>
              <div className="text-xs text-muted-foreground">متأخر</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold">{summary.activeSubscriptionCount}</div>
              <div className="text-xs text-muted-foreground">اشتراكات نشطة</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xl font-bold">{summary.inactiveSubscriptionCount}</div>
              <div className="text-xs text-muted-foreground">اشتراكات غير نشطة</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active subscriptions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">الاشتراكات النشطة</h2>
        {activeSubs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              لا توجد اشتراكات نشطة. استخدم «إضافة اشتراك» لبدء اشتراك جديد.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeSubs.map((s) => (
              <SubscriptionCard
                key={s.id}
                sub={s}
                onRenew={() => setRenewSub(s)}
                onEdit={() => setEditSub(s)}
                onDeactivate={() => setDeactivateSub(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> سجل المدفوعات
        </h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {summary.paymentHistory.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                لا توجد مدفوعات مسجلة
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الاشتراك</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الطريقة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.paymentHistory.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{fmtDate(p.date)}</TableCell>
                      <TableCell className="font-medium">
                        {fmtMoney(p.amount, p.currencySymbol)}
                      </TableCell>
                      <TableCell>{p.subscriptionLabel ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === PaymentStatus.PAID
                              ? "default"
                              : "secondary"
                          }
                          className={
                            p.status === PaymentStatus.PAID
                              ? "bg-green-100 text-green-700"
                              : undefined
                          }
                        >
                          {paymentStatusLabels[p.status as PaymentStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.method != null
                          ? paymentMethodLabels[p.method as PaymentMethod]
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inactive / historical subscriptions */}
      {inactiveSubs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            الاشتراكات غير النشطة / السابقة
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {inactiveSubs.map((s) => (
              <SubscriptionCard
                key={s.id}
                sub={s}
                onRenew={() => setRenewSub(s)}
                onEdit={() => setEditSub(s)}
                onDeactivate={() => setDeactivateSub(s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dialogs – mounted only while open so each opens with fresh state */}
      {recordOpen && (
        <RecordPaymentDialog
          studentId={studentId}
          subscriptions={activeSubs}
          open
          onOpenChange={setRecordOpen}
          onSuccess={refresh}
        />
      )}
      {addOpen && (
        <AddSubscriptionDialog
          groups={summary.groups}
          academyId={academyId}
          currencyId={currencyId}
          currencySymbol={currencySymbol}
          open
          onOpenChange={setAddOpen}
          onSuccess={refresh}
        />
      )}
      {billingOpen && (
        <BillingDateDialog
          studentId={studentId}
          billingDate={summary.billingDate}
          derivedBillingDate={summary.derivedBillingDate}
          billingDateSource={summary.billingDateSource}
          open
          onOpenChange={setBillingOpen}
          onSuccess={refresh}
        />
      )}
      {editSub && (
        <EditSubscriptionDialog
          subscription={editSub}
          open
          onOpenChange={(o) => {
            if (!o) setEditSub(null);
          }}
          onSuccess={refresh}
        />
      )}
      {renewSub && (
        <RenewSubscriptionDialog
          subscription={renewSub}
          open
          onOpenChange={(o) => {
            if (!o) setRenewSub(null);
          }}
          onSuccess={refresh}
        />
      )}
      {deactivateSub && (
        <DeactivateSubscriptionDialog
          subscription={deactivateSub}
          open
          onOpenChange={(o) => {
            if (!o) setDeactivateSub(null);
          }}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}

function SubscriptionCard({
  sub,
  onRenew,
  onEdit,
  onDeactivate,
}: {
  sub: SubscriptionFinancial;
  onRenew: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const cycle = cycleStateMeta[sub.cycleState];
  const isActive = sub.status === SubscriptionStatus.active && sub.membershipActive;
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{sub.groupTitle}</div>
            {sub.planTitle && (
              <div className="text-xs text-muted-foreground">
                الباقة: {sub.planTitle}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={subscriptionStatusColors[sub.status]}>
              {subscriptionStatusLabels[sub.status]}
            </Badge>
            {isActive && (
              <Badge className={cycle.className}>{cycle.label}</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-muted/40 p-2">
            <div className="text-muted-foreground text-xs">السعر</div>
            <div className="font-bold">
              {fmtMoney(sub.price, sub.currencySymbol)}
            </div>
          </div>
          <div className="rounded-md bg-muted/40 p-2">
            <div className="text-muted-foreground text-xs">الدورة</div>
            <div className="font-bold">كل {sub.billingCycle} يوم</div>
          </div>
          <div className="rounded-md bg-muted/40 p-2">
            <div className="text-muted-foreground text-xs">الحصص</div>
            <div className="font-bold">
              {sub.sessionCount != null ? (
                <>
                  {sub.sessionsUsed} / {sub.sessionCount} مستخدمة
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (متبقي {sub.sessionsRemaining})
                  </span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div className="rounded-md bg-muted/40 p-2">
            <div className="text-muted-foreground text-xs">الفوترة القادمة</div>
            <div className="font-bold">{fmtDate(sub.nextBillingDate ?? sub.endDate)}</div>
          </div>
        </div>

        {isActive && sub.hasSessionWarning && (
          <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
            <CreditCard className="h-3.5 w-3.5" />
            نفدت حصص هذا الاشتراك بينما الاشتراك لا يزال نشطًا
          </div>
        )}

        {sub.outstanding > 0 && isActive && (
          <div className="text-xs text-muted-foreground">
            مدفوع هذا الدورة:{" "}
            {fmtMoney(sub.paidThisCycle, sub.currencySymbol)} — متبقٍ:{" "}
            <span className="text-red-600 font-medium">
              {fmtMoney(sub.outstanding, sub.currencySymbol)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onRenew}>
            <RefreshCw className="h-3.5 w-3.5 ml-1" /> تجديد
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 ml-1" /> تعديل
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={onDeactivate}
          >
            <XCircle className="h-3.5 w-3.5 ml-1" /> إلغاء
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
