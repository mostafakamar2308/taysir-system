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
import { createSupervisor } from "@/actions/supervisor";
import { Plus } from "lucide-react";

interface AddSupervisorDialogProps {
  children?: React.ReactNode;
}

export default function AddSupervisorDialog({
  children,
}: AddSupervisorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const res = await createSupervisor(formData);
      if (!res.ok) throw new Error(res.error);
      toast({ title: "تمت إضافة المشرف بنجاح" });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> إضافة مشرف
          </Button>
        )}
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مشرف</DialogTitle>
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
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                placeholder="6 أحرف على الأقل"
                required
              />
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
