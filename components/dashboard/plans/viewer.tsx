"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddPlanDialog from "@/components/dashboard/plans/addPlanDialog";
import EditPlanDialog from "@/components/dashboard/plans/editPlanDialog";
import { deletePlan } from "@/actions/plan";

interface Plan {
  id: number;
  title: string;
  sessionsPerWeek: number;
  price: number;
  billingPeriod: number;
  currency: string;
  activeStudents: number;
  totalRevenue: number;
}

interface PlansClientProps {
  plans: Plan[];
  currencies: { id: number; code: string; name: string }[];
  academyId: number;
}

export default function PlansClient({
  plans,
  currencies,
  academyId,
}: PlansClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePlan(deleteId);
      toast({ title: "تم حذف الخطة" });
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setDeleteId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    `${amount.toLocaleString("ar-EG")} ${currency}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">خطط الاشتراك</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة خطط الأسعار والاشتراكات
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 ml-2" /> إضافة خطة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{plan.title}</CardTitle>
              <Badge variant="secondary">
                {plan.sessionsPerWeek} حصص/أسبوع
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold">
                  {formatCurrency(plan.price, plan.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {plan.billingPeriod} يوم
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.activeStudents} مشترك نشط</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatCurrency(plan.totalRevenue, plan.currency)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      router.push(`/ar/dashboard/plans/${plan.id}`)
                    }
                  >
                    تفاصيل
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingPlan(plan);
                      setEditOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteId(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddPlanDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        currencies={currencies}
        academyId={academyId}
      />
      {editingPlan && (
        <EditPlanDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          plan={editingPlan}
          currencies={currencies}
        />
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الخطة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الخطة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
