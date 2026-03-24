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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createTutor } from "@/actions/tutor";
import { Plus } from "lucide-react";

interface AddTutorDialogProps {
  specialities: { id: number; title: string }[];
  currencies: { id: number; name: string }[];
  academyId: number;
  children?: React.ReactNode;
}

export default function AddTutorDialog({
  specialities,
  currencies,
  academyId,
  children,
}: AddTutorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      formData.append("academyId", academyId.toString());
      await createTutor(formData);
      toast({ title: "تم إضافة المعلم بنجاح" });
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
            <Plus className="h-4 w-4" /> إضافة معلم
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة معلم جديد</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">الاسم *</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input id="phone" name="phone" required />
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
              <Label htmlFor="pricePerSession">سعر الحصة</Label>
              <Input
                id="pricePerSession"
                name="pricePerSession"
                type="number"
                step="0.01"
                required
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="currencyId">العملة</Label>
              <Select name="currencyId">
                <SelectTrigger>
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="specialities">التخصصات</Label>
              <Select name="specialities">
                <SelectTrigger>
                  <SelectValue placeholder="اختر التخصصات" />
                </SelectTrigger>
                <SelectContent>
                  {specialities.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bio">النبذة التعريفية</Label>
              <Textarea id="bio" name="bio" />
            </div>
            <div>
              <Label htmlFor="qualifications">المؤهلات</Label>
              <Textarea id="qualifications" name="qualifications" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="active" name="active" defaultChecked />
            <Label htmlFor="active">نشط</Label>
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
              {loading ? "جاري الحفظ..." : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
