"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, Users, TrendingUp } from "lucide-react";
import EditPlanDialog from "@/components/dashboard/plans/editPlanDialog";

interface PlanDetailClientProps {
  plan: {
    id: number;
    title: string;
    sessionsPerWeek: number;
    price: number;
    billingPeriod: number;
    currency: string;
  };
  activeStudents: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    status: number;
    startDate: Date;
    endDate: Date | null;
  }[];
  totalRevenue: number;
  currencies: {
    symbol: string;
    id: number;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string;
  }[];
}

export default function PlanDetailClient({
  plan,
  activeStudents,
  totalRevenue,
  currencies,
}: PlanDetailClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const formatCurrency = (amount: number, code: string) =>
    `${amount.toLocaleString("ar-EG")} ${code}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/ar/dashboard/plans")}
            className="mb-2"
          >
            <ArrowRight className="h-4 w-4 ml-2" /> العودة للخطط
          </Button>
          <h1 className="text-2xl font-bold">{plan.title}</h1>
        </div>
        <Button onClick={() => setEditOpen(true)}>تعديل الخطة</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              المشتركين النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {activeStudents.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {formatCurrency(totalRevenue, plan.currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الخطة</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">الحصص/أسبوع</p>
            <p className="font-medium">{plan.sessionsPerWeek}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">السعر</p>
            <p className="font-medium">
              {formatCurrency(plan.price, plan.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">فترة الفوترة</p>
            <p className="font-medium">{plan.billingPeriod} يوم</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">العملة</p>
            <p className="font-medium">{plan.currency}</p>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>الطلاب المشتركين</CardTitle>
        </CardHeader>
        <CardContent>
          {activeStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا يوجد مشتركين في هذه الخطة
            </p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>تاريخ البدء</TableHead>
                    <TableHead>تاريخ الانتهاء</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.email || "—"}</TableCell>
                      <TableCell>{student.phone || "—"}</TableCell>
                      <TableCell>
                        {new Date(student.startDate).toLocaleDateString(
                          "ar-EG",
                        )}
                      </TableCell>
                      <TableCell>
                        {student.endDate
                          ? new Date(student.endDate).toLocaleDateString(
                              "ar-EG",
                            )
                          : "مفتوح"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/ar/dashboard/students/${student.id}`)
                          }
                        >
                          عرض الملف
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

      <EditPlanDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        plan={{
          id: plan.id,
          title: plan.title,
          sessionsPerWeek: plan.sessionsPerWeek,
          price: plan.price,
          billingPeriod: plan.billingPeriod,
          currency: plan.currency,
          activeStudents: activeStudents.length,
          totalRevenue,
        }}
        currencies={currencies}
      />
    </div>
  );
}
