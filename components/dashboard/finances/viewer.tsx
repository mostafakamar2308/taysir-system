"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, TrendingUp, Banknote, Users } from "lucide-react";
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

interface FinancesClientProps {
  initialPayments: PaymentRecord[];
  initialExpenses: ExpenseRecord[];
  academyId: number;
  students: StudentOption[];
  tutors: TutorOption[];
  plans: PlanOption[];
}

export default function FinancesClient({
  initialPayments,
  initialExpenses,
  academyId,
  students,
  tutors,
  plans,
}: FinancesClientProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [expenses, setExpenses] = useState(initialExpenses);

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">المالية</h1>
        <p className="text-sm text-muted-foreground">
          إدارة الإيرادات والمصروفات والرواتب
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
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
          <FinancialDashboard payments={payments} expenses={expenses} />
        </TabsContent>

        <TabsContent value="revenues">
          <RevenuesTab
            payments={payments}
            setPayments={setPayments}
            students={students}
            plans={plans}
            academyId={academyId}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab
            expenses={expenses}
            setExpenses={setExpenses}
            tutors={tutors}
            academyId={academyId}
          />
        </TabsContent>

        <TabsContent value="salaries">
          <SalariesTab academyId={academyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
