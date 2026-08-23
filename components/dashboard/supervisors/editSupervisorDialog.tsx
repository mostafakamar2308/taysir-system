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
import { updateSupervisor } from "@/actions/supervisor";
import { Pencil } from "lucide-react";

interface EditSupervisorDialogProps {
  supervisor: {
    id: number;
    name: string;
    email: string;
    phone: string;
    timezone: string;
  };
  children?: React.ReactNode;
}

export default function EditSupervisorDialog({
  supervisor,
  children,
}: EditSupervisorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const res = await updateSupervisor(supervisor.id, formData);
      if (!res.ok) throw new Error(res.error);
      toast({ title: "تم تحديث المشرف بنجاح" });
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
          <Button variant="ghost" size="sm" className="gap-1">
            <Pencil className="h-4 w-4" /> تعديل
          </Button>
        )}
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل المشرف</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">الاسم *</Label>
              <Input id="name" name="name" defaultValue={supervisor.name} required />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={supervisor.email}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input id="phone" name="phone" defaultValue={supervisor.phone} required />
            </div>
            <div>
              <Label htmlFor="timezone">المنطقة الزمنية *</Label>
              <Select name="timezone" defaultValue={supervisor.timezone}>
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
              {loading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
