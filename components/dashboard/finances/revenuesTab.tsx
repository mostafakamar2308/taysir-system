"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getRevenueKPIs,
  getOverdueRevenue,
  getRenewalSubscriptions,
  getRevenueHistory,
  markRevenueAsPaid,
  createRevenueForSubscription,
  updateRevenue,
  RevenueKPIs,
  OverdueRevenueItem,
  RenewalSubscription,
  RevenueHistoryItem,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Edit,
  SendHorizonal,
} from "lucide-react";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/enums";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import SendBulkMessagesDialog from "../common/SendBulkMessagesDialog";

interface RevenuesTabProps {
  academyId: number;
  defaultCurrency: { code: string; symbol: string };
  period: "all" | "year" | "month";
  year: number;
  month: number;
  students: { id: number; name: string | null }[];
}

// Edit Revenue Dialog
function EditRevenueDialog({
  open,
  onOpenChange,
  revenue,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue: RevenueHistoryItem;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(revenue.amount.toString());
  const [status, setStatus] = useState(revenue.status.toString());
  const [method, setMethod] = useState((revenue.method ?? 0).toString());
  const [dueDate, setDueDate] = useState(revenue.dueDate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(revenue.amount.toString());
      setStatus(revenue.status.toString());
      setMethod((revenue.method ?? 0).toString());
      setDueDate(revenue.dueDate);
    }
  }, [open, revenue]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateRevenue(revenue.id, {
        amount: parseFloat(amount),
        status: parseInt(status),
        method: parseInt(method),
        dueDate,
      });
      toast.success("تم تحديث الإيراد بنجاح");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("فشل في تحديث الإيراد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل الإيراد</DialogTitle>
          <DialogDescription>
            الطالب: {revenue.studentName}{" "}
            {revenue.planName ? "- " + revenue.planName : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>المبلغ</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>الحالة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentStatusLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>طريقة الدفع</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>تاريخ الاستحقاق</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Tab
export default function RevenuesTab({
  academyId,
  defaultCurrency,
  period,
  year,
  month,
  students,
}: RevenuesTabProps) {
  // Filters
  const [studentId, setStudentId] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");

  // Data
  const [kpis, setKpis] = useState<RevenueKPIs | null>(null);
  const [overdueRevenue, setOverdueRevenue] = useState<OverdueRevenueItem[]>(
    [],
  );
  const [renewals, setRenewals] = useState<{
    upcoming: RenewalSubscription[];
    overdue: RenewalSubscription[];
  }>({ upcoming: [], overdue: [] });
  const [history, setHistory] = useState<RevenueHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk Message Dialog state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPhones, setBulkPhones] = useState<{ phone: string }[]>([]);

  // Edit Dialog state
  const [editRevenue, setEditRevenue] = useState<RevenueHistoryItem | null>(
    null,
  );

  const studentIdNum = studentId === "all" ? undefined : parseInt(studentId);
  const methodNum = method === "all" ? undefined : parseInt(method);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpisData, overdueData, renewalData, historyData] =
        await Promise.all([
          getRevenueKPIs(academyId, period, year, month, {
            studentId: studentIdNum,
            method: methodNum,
          }),
          getOverdueRevenue(academyId, period, year, month),
          getRenewalSubscriptions(academyId),
          getRevenueHistory(
            academyId,
            period,
            year,
            month,
            studentIdNum,
            methodNum,
          ),
        ]);
      setKpis(kpisData);
      setOverdueRevenue(overdueData);
      setRenewals(renewalData);
      setHistory(historyData);
    } catch {
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [academyId, period, year, month, studentIdNum, methodNum]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleMarkAsPaid = async (revenueId: number) => {
    try {
      await markRevenueAsPaid(revenueId);
      toast.success("تم تحديث الحالة إلى مدفوعة");
      fetchData();
    } catch {
      toast.error("فشل في تحديث الحالة");
    }
  };

  const handleMarkRenewalAsPaid = async (subscriptionId: number) => {
    try {
      await createRevenueForSubscription(subscriptionId);
      toast.success("تم إنشاء الإيراد وتجديد الاشتراك");
      fetchData();
    } catch {
      toast.error("فشل في إنشاء الإيراد");
    }
  };

  // Bulk contact
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

  // Refresh after edit
  const handleEditSuccess = () => {
    fetchData();
  };

  // Helpers
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

  return (
    <div className="space-y-6">
      {/* Filters (student + method) */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">الطالب</label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل الطلاب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الطلاب</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">طريقة الدفع</label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل الطرق" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الطرق</SelectItem>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setStudentId("all");
            setMethod("all");
          }}
        >
          إعادة تعيين
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          : kpis && (
              <>
                <KPICard
                  title="إجمالي الإيرادات (الفترة)"
                  value={kpis.totalRevenue}
                  symbol={defaultCurrency.symbol}
                  variant="success"
                />
                <KPICard
                  title="متوسط العائد لكل طالب دافع"
                  value={kpis.arps}
                  symbol={defaultCurrency.symbol}
                />
              </>
            )}
      </div>

      {/* Breakdowns */}
      {!loading && kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات حسب الخطة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.revenuePerPlan.map((plan) => (
                <div key={plan.planId} className="flex justify-between">
                  <span>{plan.planName}</span>
                  <span className="font-mono">
                    {formatCurrency(plan.totalRevenue, defaultCurrency.symbol)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>العائد حسب المعلم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.revenuePerTutor.map((t) => (
                <div key={t.tutorId} className="flex justify-between">
                  <span>{t.tutorName}</span>
                  <span className="font-mono">
                    {formatCurrency(t.totalRevenue, defaultCurrency.symbol)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات حسب طريقة الدفع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.revenuePerMethod.map((m) => (
                <div key={m.method} className="flex justify-between">
                  <span>{getPaymentMethodLabel(m.method)}</span>
                  <span className="font-mono">
                    {formatCurrency(m.totalRevenue, defaultCurrency.symbol)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Revenue Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" /> الإيرادات المتأخرة
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
              لا توجد دفعات متأخرة
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
                                <MessageSquare className="h-4 w-4 ml-1" />{" "}
                                واتساب
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
      </Card>

      {/* Renewal Tables (upcoming & overdue) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" /> تجديد
            الاشتراكات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : renewals.upcoming.length === 0 &&
            renewals.overdue.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              لا توجد اشتراكات قريبة الانتهاء
            </p>
          ) : (
            <div className="space-y-6">
              {/* Upcoming Renewals */}
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
                      {renewals.upcoming.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>{sub.studentName}</TableCell>
                          <TableCell>{sub.planName}</TableCell>
                          <TableCell>{sub.endDate}</TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(
                              sub.planPrice,
                              defaultCurrency.symbol,
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkRenewalAsPaid(sub.id)}
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
                                    <MessageSquare className="h-4 w-4 ml-1" />{" "}
                                    واتساب
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

              {/* Overdue Renewals */}
              {renewals.overdue.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-red-600">
                      فائتة
                    </h3>
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
                      {renewals.overdue.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>{sub.studentName}</TableCell>
                          <TableCell>{sub.planName}</TableCell>
                          <TableCell>{sub.endDate}</TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(
                              sub.planPrice,
                              defaultCurrency.symbol,
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkRenewalAsPaid(sub.id)}
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
                                    <MessageSquare className="h-4 w-4 ml-1" />{" "}
                                    واتساب
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue History */}
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
      </Card>

      {/* Edit Revenue Dialog rendered conditionally */}
      {editRevenue && (
        <EditRevenueDialog
          open={!!editRevenue}
          onOpenChange={(open) => {
            if (!open) setEditRevenue(null);
          }}
          revenue={editRevenue}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Bulk WhatsApp Dialog */}
      {bulkOpen && (
        <SendBulkMessagesDialog
          open={bulkOpen}
          setOpen={setBulkOpen}
          users={bulkPhones}
        />
      )}
    </div>
  );
}

// Keep KPICard sub-component
function KPICard({
  title,
  value,
  symbol,
  variant,
}: {
  title: string;
  value: number;
  symbol: string;
  variant?: string;
}) {
  const color = variant === "success" ? "text-green-600" : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          {formatCurrency(value, symbol)}
        </div>
      </CardContent>
    </Card>
  );
}
