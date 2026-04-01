"use client";

import { useEffect, useState } from "react";
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
import { getStudent, updateStudent } from "@/actions/student";
import { User, CreditCard, MoreHorizontal } from "lucide-react";
import { StudentStatus } from "@/types/student";
import { Student } from "@/generated/prisma/browser";

interface EditStudentDialogProps {
  studentId: number;
  tutors: { id: number; name: string | null }[];
  plans: { id: number; title: string }[];
  currencies: { id: number; name: string }[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditStudentDialog({
  studentId,
  tutors,
  plans,
  currencies,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditStudentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const isLead = student?.status === StudentStatus.lead;

  useEffect(() => {
    async function fetchStudent() {
      setStudent(await getStudent(studentId));
    }
    if (controlledOpen) fetchStudent();
  }, [studentId, controlledOpen]);

  async function handleSubmit(formData: FormData) {
    if (!student) return;
    setLoading(true);
    try {
      await updateStudent(student.id, formData);
      toast({ title: "تم تحديث بيانات الطالب" });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  if (!student) return <div></div>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تعديل بيانات الطالب</DialogTitle>
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
                <Input
                  id="name"
                  name="name"
                  defaultValue={student.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={student.email || ""}
                />
              </div>
              <div>
                <Label htmlFor="age">العمر *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  defaultValue={student.age}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={student.phone || ""}
                />
              </div>
              <div>
                <Label htmlFor="country">الدولة</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={student.country || ""}
                />
              </div>
              <div>
                <Label htmlFor="timezone">المنطقة الزمنية *</Label>
                <Select name="timezone" defaultValue={student.timezone}>
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
                <Input
                  id="preferredLanguage"
                  name="preferredLanguage"
                  defaultValue={student.preferredLanguage || ""}
                />
              </div>
              <div>
                <Label htmlFor="source">المصدر</Label>
                <Input
                  id="source"
                  name="source"
                  defaultValue={student.source || ""}
                />
              </div>
              <div>
                <Label htmlFor="currentProgram">البرنامج</Label>
                <Input
                  id="currentProgram"
                  name="currentProgram"
                  defaultValue={student.currentProgram || ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>جهة اتصال الطوارئ</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="emergencyContactName"
                  placeholder="الاسم"
                  defaultValue={student.emergencyContactName || ""}
                />
                <Input
                  name="emergencyContactPhone"
                  placeholder="الهاتف"
                  defaultValue={student.emergencyContactPhone || ""}
                />
              </div>
            </div>
          </div>

          {/* Group 2: Subscription Information (hidden for leads) */}
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
                    defaultValue={student.status.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(StudentStatus.trial)}>
                        تجريبي
                      </SelectItem>
                      <SelectItem value={String(StudentStatus.subscribed)}>
                        مشترك
                      </SelectItem>
                      <SelectItem value={String(StudentStatus.lead)}>
                        عميل محتمل
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="planId">الخطة</Label>
                  <Select
                    name="planId"
                    defaultValue={
                      student.planId ? String(student.planId) : "none"
                    }
                  >
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
                    defaultValue={student.currencyId.toString()}
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
                  <Select
                    name="tutorId"
                    defaultValue={
                      student.tutorId ? String(student.tutorId) : "none"
                    }
                  >
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
              </div>
            </div>
          )}

          {/* If lead, still show status selector (in a minimal group) */}
          {isLead && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                <CreditCard className="h-4 w-4" /> الحالة
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="status">الحالة</Label>
                  <Select
                    name="status"
                    defaultValue={student.status.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(StudentStatus.trial)}>
                        تجريبي
                      </SelectItem>
                      <SelectItem value={String(StudentStatus.subscribed)}>
                        مشترك
                      </SelectItem>
                      <SelectItem value={String(StudentStatus.lead)}>
                        عميل محتمل
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Group 3: Other Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
              <MoreHorizontal className="h-4 w-4" /> أخرى
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="imageUrl">صورة الملف</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="رابط الصورة"
                  defaultValue={student.imageUrl || ""}
                />
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Input id="notes" name="notes" placeholder="ملاحظات إضافية" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
