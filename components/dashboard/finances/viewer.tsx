"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  TrendingUp,
  Banknote,
  Users,
  Calendar,
} from "lucide-react";
import FinancialDashboard from "@/components/dashboard/finances/financialDashboard";
import RevenuesTab from "@/components/dashboard/finances/revenuesTab";
import ExpensesTab from "@/components/dashboard/finances/expensesTab";
import SalariesTab from "@/components/dashboard/finances/salariesTab";
import {
  ExpenseRecord,
  PaymentRecord,
  PlanOption,
  StudentOption,
  TutorOption,
} from "@/types/finances";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ExpenseFormDialog from "./expenseFormDialog";
import RevenueFormDialog from "./revenueFormDialog";

interface FinancesClientProps {
  initialPayments: PaymentRecord[];
  initialExpenses: ExpenseRecord[];
  academyId: number;
  students: StudentOption[];
  tutors: TutorOption[];
  plans: PlanOption[];
  currencies: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  }[];
  defaultCurrency: { code: string; symbol: string; name: string };
}

type PeriodType = "all" | "year" | "month";

export default function FinancesClient({
  academyId,
  defaultCurrency,
  plans,
  currencies,
  students,
  tutors,
}: FinancesClientProps) {
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Period filter state
  const [periodType, setPeriodType] = useState<PeriodType>("all");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
  }, []);

  const monthOptions = [
    { value: 1, label: "يناير" },
    { value: 2, label: "فبراير" },
    { value: 3, label: "مارس" },
    { value: 4, label: "أبريل" },
    { value: 5, label: "مايو" },
    { value: 6, label: "يونيو" },
    { value: 7, label: "يوليو" },
    { value: 8, label: "أغسطس" },
    { value: 9, label: "سبتمبر" },
    { value: 10, label: "أكتوبر" },
    { value: 11, label: "نوفمبر" },
    { value: 12, label: "ديسمبر" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">المالية</h1>
        <p className="text-sm text-muted-foreground">
          إدارة الإيرادات والمصروفات والرواتب
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">الفترة:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={periodType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodType("all")}
          >
            كل الوقت
          </Button>
          <Button
            variant={periodType === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodType("year")}
          >
            سنة كاملة
          </Button>
          <Button
            variant={periodType === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodType("month")}
          >
            شهر محدد
          </Button>
        </div>

        {periodType === "year" && (
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {periodType === "month" && (
          <>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="السنة" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الشهر" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      <Tabs defaultValue="dashboard" dir="rtl" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="dashboard" className="gap-2 text-xs sm:text-sm">
            <LayoutDashboard className="h-4 w-4 hidden sm:block" /> لوحة التحكم
          </TabsTrigger>
          <TabsTrigger value="revenues" className="gap-2 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 hidden sm:block" /> الإيرادات
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2 text-xs sm:text-sm">
            <Banknote className="h-4 w-4 hidden sm:block" /> المصروفات
          </TabsTrigger>
          <TabsTrigger value="salaries" className="gap-2 text-xs sm:text-sm">
            <Users className="h-4 w-4 hidden sm:block" /> الرواتب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FinancialDashboard
            academyId={academyId}
            defaultCurrency={defaultCurrency}
            period={periodType}
            year={selectedYear}
            month={selectedMonth}
            onAddRevenue={() => setShowAddRevenue(true)}
            onAddExpense={() => setShowAddExpense(true)}
          />
        </TabsContent>

        <TabsContent value="revenues">
          <RevenuesTab
            academyId={academyId}
            defaultCurrency={defaultCurrency}
            period={periodType}
            year={selectedYear}
            month={selectedMonth}
            students={students}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab
            academyId={academyId}
            defaultCurrency={defaultCurrency}
            period={periodType}
            year={selectedYear}
            month={selectedMonth}
            tutors={tutors}
          />
        </TabsContent>

        <TabsContent value="salaries">
          <SalariesTab
            defaultCurrency={defaultCurrency}
            tutors={tutors}
            academyId={academyId}
          />
        </TabsContent>
      </Tabs>
      {showAddRevenue && (
        <RevenueFormDialog
          open={showAddRevenue}
          onOpenChange={setShowAddRevenue}
          editingPayment={null}
          students={students}
          plans={plans}
          currencies={currencies}
          academyId={academyId}
        />
      )}

      {/* Add Expense Dialog */}
      {showAddExpense && (
        <ExpenseFormDialog
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
          editingExpense={null}
          tutors={tutors}
          currencies={currencies}
          academyId={academyId}
        />
      )}
    </div>
  );
}
