"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/finances";
import { formatDate } from "@/lib/dates";
import { PaymentStatus } from "@/types/payment";

interface PaymentHistoryItem {
  id: number;
  month: string | null;
  amount: number;
  status: number;
  date: string;
  description: string | null;
}

interface FinancesClientProps {
  sessionCount: number;
  expectedEarnings: number;
  paidThisMonth: number;
  remainingEarnings: number;
  currency: string;
  paymentHistory: PaymentHistoryItem[];
  monthlyEarnings: { month: string; earnings: number }[];
}

export default function FinancesClient({
  sessionCount,
  expectedEarnings,
  paidThisMonth,
  remainingEarnings,
  currency,
  paymentHistory,
  monthlyEarnings,
}: FinancesClientProps) {
  const paidPercentage =
    expectedEarnings > 0 ? (paidThisMonth / expectedEarnings) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">المالية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          نظرة عامة على أرباحك ومدفوعاتك
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الحصص هذا الشهر</p>
              <p className="text-2xl font-bold">{sessionCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المستحق</p>
              <p className="text-2xl font-bold">
                {formatCurrency(expectedEarnings, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المدفوع</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(paidThisMonth, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المتبقي</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(remainingEarnings, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تقدم الرواتب هذا الشهر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>المدفوع</span>
              <span>{paidPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(paidThisMonth, currency)}</span>
              <span>{formatCurrency(expectedEarnings, currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Chart */}
      {monthlyEarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الأرباح الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyEarnings}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value?: number) =>
                    formatCurrency(value, currency)
                  }
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="hsl(152, 69%, 33%)"
                  strokeWidth={2}
                  name="الأرباح"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              لا توجد مدفوعات مسجلة
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.month}</TableCell>
                      <TableCell>{formatDate(p.date)}</TableCell>
                      <TableCell>{p.description || "راتب شهري"}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(p.amount, currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            p.status === PaymentStatus.PAID
                              ? "bg-green-100 text-green-700"
                              : p.status === PaymentStatus.PENDING
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }
                        >
                          {p.status === PaymentStatus.PAID
                            ? "مدفوع"
                            : p.status === PaymentStatus.PENDING
                              ? "معلق"
                              : "فشل"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
