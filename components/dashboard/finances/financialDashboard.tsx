"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  formatCurrency,
  formatDate,
  paymentStatusColors,
  paymentStatusLabels,
} from "@/lib/finances";
import { PaymentStatus } from "@/types/payment";
import { ExpenseRecord, PaymentRecord } from "@/types/finances";

interface FinancialDashboardProps {
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
}

export default function FinancialDashboard({
  payments,
  expenses,
}: FinancialDashboardProps) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const monthPayments = payments.filter((p) => p.date.startsWith(currentMonth));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));

  const totalRevenue = monthPayments
    .filter((p) => p.status === PaymentStatus.PAID)
    .reduce((s, p) => s + p.amount, 0);
  const totalExpenses = monthExpenses
    .filter((e) => e.paid)
    .reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const pendingRevenue = monthPayments
    .filter((p) => p.status === PaymentStatus.PENDING)
    .reduce((s, p) => s + p.amount, 0);
  const unpaidExpenses = monthExpenses
    .filter((e) => !e.paid)
    .reduce((s, e) => s + e.amount, 0);
  const estimatedSalaries = monthExpenses
    .filter((e) => e.costCenter === "رواتب")
    .reduce((s, e) => s + e.amount, 0);

  // Monthly chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; expenses: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      months[key] = { revenue: 0, expenses: 0 };
    }
    payments.forEach((p) => {
      if (p.status === PaymentStatus.PAID && months[p.date.slice(0, 7)]) {
        months[p.date.slice(0, 7)].revenue += p.amount;
      }
    });
    expenses.forEach((e) => {
      if (e.paid && months[e.date.slice(0, 7)]) {
        months[e.date.slice(0, 7)].expenses += e.amount;
      }
    });
    return Object.entries(months).map(([month, values]) => ({
      month: new Date(month + "-01").toLocaleDateString("ar-EG", {
        month: "short",
      }),
      ...values,
    }));
  }, [payments, expenses]);

  // Expenses by category
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      if (e.paid) {
        const cat = e.costCenter || "أخرى";
        map.set(cat, (map.get(cat) || 0) + e.amount);
      }
    });
    const colors = [
      "hsl(152, 69%, 33%)",
      "hsl(43, 74%, 52%)",
      "hsl(220, 70%, 55%)",
      "hsl(280, 60%, 55%)",
      "hsl(0, 70%, 55%)",
    ];
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value,
      fill: colors[i % colors.length],
    }));
  }, [expenses]);

  // Recent transactions
  const recent = [
    ...payments.map((p) => ({
      date: p.date,
      desc: `${p.studentName} - ${p.description || ""}`,
      amount: p.amount,
      type: "إيراد" as const,
      statusLabel: paymentStatusLabels[p.status],
      statusColor: paymentStatusColors[p.status],
    })),
    ...expenses.map((e) => ({
      date: e.date,
      desc: e.description,
      amount: e.amount,
      type: "مصروف" as const,
      statusLabel: e.paid ? "مدفوع" : "غير مدفوع",
      statusColor: e.paid
        ? "bg-primary/10 text-primary"
        : "bg-amber-100 text-amber-700",
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const summaryCards = [
    {
      title: "إجمالي الإيرادات",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "إجمالي المصروفات",
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: "text-destructive",
    },
    {
      title: "صافي الربح",
      value: formatCurrency(netProfit),
      icon: DollarSign,
      color: netProfit >= 0 ? "text-primary" : "text-destructive",
    },
    {
      title: "إيرادات معلقة",
      value: formatCurrency(pendingRevenue),
      icon: Clock,
      color: "text-amber-600",
    },
    {
      title: "مصروفات غير مدفوعة",
      value: formatCurrency(unpaidExpenses),
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: "رواتب الشهر المقدرة",
      value: formatCurrency(estimatedSalaries),
      icon: Users,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{card.title}</p>
              <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              الإيرادات مقابل المصروفات (آخر 6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(152, 69%, 33%)"
                  strokeWidth={2}
                  name="الإيرادات"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  name="المصروفات"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">المصروفات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {byCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-right py-2 px-3 font-medium">التاريخ</th>
                  <th className="text-right py-2 px-3 font-medium">الوصف</th>
                  <th className="text-right py-2 px-3 font-medium">المبلغ</th>
                  <th className="text-right py-2 px-3 font-medium">النوع</th>
                  <th className="text-right py-2 px-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-2.5 px-3">{formatDate(t.date)}</td>
                    <td className="py-2.5 px-3">{t.desc}</td>
                    <td className="py-2.5 px-3 font-medium">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={
                          t.type === "إيراد"
                            ? "border-primary/30 text-primary"
                            : "border-destructive/30 text-destructive"
                        }
                      >
                        {t.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge className={t.statusColor}>{t.statusLabel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
