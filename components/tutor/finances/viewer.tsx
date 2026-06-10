"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("TutorFinances");
  const paidPercentage =
    expectedEarnings > 0 ? (paidThisMonth / expectedEarnings) * 100 : 0;

  const getPaymentStatusBadge = (status: number) => {
    switch (status) {
      case PaymentStatus.PAID:
        return {
          label: t("paymentStatus.paid"),
          className: "bg-green-100 text-green-700",
        };
      case PaymentStatus.PENDING:
        return {
          label: t("paymentStatus.pending"),
          className: "bg-amber-100 text-amber-700",
        };
      default:
        return {
          label: t("paymentStatus.failed"),
          className: "bg-red-100 text-red-700",
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("cards.sessions")}
              </p>
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
              <p className="text-xs text-muted-foreground">
                {t("cards.expected")}
              </p>
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
              <p className="text-xs text-muted-foreground">{t("cards.paid")}</p>
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
              <p className="text-xs text-muted-foreground">
                {t("cards.remaining")}
              </p>
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
          <CardTitle className="text-base">{t("progress.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("progress.paid")}</span>
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
            <CardTitle className="text-base">{t("chart.title")}</CardTitle>
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
                  formatter={(value) =>
                    typeof value === "number" ? formatCurrency(value) : ""
                  }
                  labelFormatter={(label) => `${t("chart.month")}: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="hsl(152, 69%, 33%)"
                  strokeWidth={2}
                  name={t("chart.earningsName")}
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
          <CardTitle className="text-base">{t("history.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {t("history.empty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("history.headers.month")}</TableHead>
                    <TableHead>{t("history.headers.date")}</TableHead>
                    <TableHead>{t("history.headers.description")}</TableHead>
                    <TableHead>{t("history.headers.amount")}</TableHead>
                    <TableHead>{t("history.headers.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((p) => {
                    const statusBadge = getPaymentStatusBadge(p.status);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{p.month}</TableCell>
                        <TableCell>{formatDate(p.date)}</TableCell>
                        <TableCell>
                          {p.description || t("history.defaultDescription")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(p.amount, currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
