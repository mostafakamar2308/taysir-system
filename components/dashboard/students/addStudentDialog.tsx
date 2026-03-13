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
import { Plus } from "lucide-react";

interface AddStudentDialogProps {
  tutors: { id: number; name: string }[];
  plans: { id: number; title: string }[];
  academyId: number; // from context
}

export default function AddStudentDialog({
  tutors,
  plans,
  academyId,
}: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
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
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> إضافة طالب
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة طالب جديد</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
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
              <Label htmlFor="status">الحالة</Label>
              <Select name="status" defaultValue="0">
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">تجريبي</SelectItem>
                  <SelectItem value="1">مشترك</SelectItem>
                  <SelectItem value="2">عميل محتمل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="planId">الخطة</Label>
              <Select name="planId" defaultValue={String(plans[0].id)}>
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
              <Label htmlFor="tutorId">المعلم</Label>
              <Select name="tutorId" defaultValue={String(tutors[0].id)}>
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
              <Label htmlFor="source">المصدر</Label>
              <Input id="source" name="source" />
            </div>
            <div>
              <Label htmlFor="currentProgram">البرنامج الحالي</Label>
              <Input id="currentProgram" name="currentProgram" />
            </div>
            <div>
              <Label htmlFor="preferredLanguage">اللغة المفضلة</Label>
              <Input id="preferredLanguage" name="preferredLanguage" />
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

          <div className="space-y-2">
            <Label>جهة اتصال الطوارئ</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input name="emergencyContactName" placeholder="الاسم" />
              <Input name="emergencyContactPhone" placeholder="الهاتف" />
            </div>
          </div>

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
