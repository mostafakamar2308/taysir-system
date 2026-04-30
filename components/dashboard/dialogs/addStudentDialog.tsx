"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createStudent } from "@/actions/student";
import { Plus, User, CreditCard } from "lucide-react";
import { StudentStatus } from "@/types/student";

interface AddStudentDialogProps {
  tutors: { id: number; name: string | null }[];
  plans: { id: number; title: string }[];
  currencies: { id: number; name: string }[];
  academyId?: number;
  children?: React.ReactNode;
}

export default function AddStudentDialog({
  tutors,
  plans,
  currencies,
  academyId,
  children,
}: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(StudentStatus.lead.toString());
  const router = useRouter();
  const { toast } = useToast();

  const isLead = status === StudentStatus.lead.toString();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (!academyId) return;
      formData.append("academyId", academyId.toString());
      await createStudent(formData);
      toast({ title: "تم إضافة الطالب بنجاح" });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.log({ error });
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> إضافة طالب
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة طالب جديد</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6">
          {/* Group 1: Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
              <User className="h-4 w-4" /> المعلومات الشخصية
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">الاسم *</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="age">العمر *</Label>
                <Input id="age" name="age" type="number" required />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" name="phone" />
                <span className="text-xs text-slate-600">برجاء كتابة الرقم بالصيغة الدولية</span>
              </div>
              <div>
                <Label htmlFor="country">الدولة</Label>
                <Input id="country" name="country" />
              </div>
              <div>
                <Label htmlFor="timezone">المنطقة الزمنية *</Label>
                <Select name="timezone" defaultValue="Africa/Cairo">
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنطقة الزمنية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Cairo">القاهرة</SelectItem>
                    <SelectItem value="Asia/Riyadh">الرياض</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="preferredLanguage">اللغة المفضلة</Label>
                <Input id="preferredLanguage" name="preferredLanguage" />
              </div>
              <div>
                <Label htmlFor="source">المصدر</Label>
                <Input id="source" name="source" />
              </div>
              <div>
                <Label htmlFor="currentProgram">البرنامج</Label>
                <Input id="currentProgram" name="currentProgram" />
              </div>
            </div>
          </div>

          {!isLead && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                <CreditCard className="h-4 w-4" /> معلومات الاشتراك
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">الحالة</Label>
                  <Select
                    name="status"
                    value={status}
                    onValueChange={setStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StudentStatus.trial.toString()}>
                        تجريبي
                      </SelectItem>
                      <SelectItem value={StudentStatus.subscribed.toString()}>
                        مشترك
                      </SelectItem>
                      <SelectItem value={StudentStatus.lead.toString()}>
                        عميل محتمل
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="planId">الخطة</Label>
                  <Select name="planId" defaultValue={String(plans[0]?.id)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخطة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون خطة</SelectItem>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currencyId">العملة</Label>
                  <Select
                    name="currencyId"
                    defaultValue={currencies[0]?.id.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون عملة</SelectItem>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tutorId">المعلم</Label>
                  <Select name="tutorId" defaultValue={String(tutors[0]?.id)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المعلم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون معلم</SelectItem>
                      {tutors.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">تاريخ البدء</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="renewalDate">تاريخ التجديد</Label>
                  <Input id="renewalDate" name="renewalDate" type="date" />
                </div>
              </div>
            </div>
          )}

          {/* If lead, still show status selector (in a minimal group) */}
          {isLead && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                <CreditCard className="h-4 w-4" /> الحالة
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">الحالة</Label>
                  <Select
                    name="status"
                    value={status}
                    onValueChange={setStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StudentStatus.trial.toString()}>
                        تجريبي
                      </SelectItem>
                      <SelectItem value={StudentStatus.subscribed.toString()}>
                        مشترك
                      </SelectItem>
                      <SelectItem value={StudentStatus.lead.toString()}>
                        عميل محتمل
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currencyId">العملة</Label>
                  <Select
                    name="currencyId"
                    defaultValue={currencies[0]?.id.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون عملة</SelectItem>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogTrigger asChild>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الحفظ..." : "إضافة"}
              </Button>
            </div>
          </DialogTrigger>
        </form>
      </DialogContent>
    </Dialog>
  );
}
