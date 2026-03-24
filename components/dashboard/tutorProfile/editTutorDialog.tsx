"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { updateTutor } from "@/actions/tutor";

interface EditTutorDialogProps {
  tutor: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    timezone: string;
    pricePerSession: number;
    currency: string;
    bio?: string | null;
    qualifications?: string | null;
    active?: boolean;
    zoomAuthenticated?: boolean;
    zoomUrl?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditTutorDialog({
  tutor,
  open,
  onOpenChange,
}: EditTutorDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tutor.name,
    email: tutor.email,
    phone: tutor.phone || "",
    timezone: tutor.timezone,
    pricePerSession: String(tutor.pricePerSession),
    bio: tutor.bio || "",
    qualifications: tutor.qualifications || "",
    active: tutor.active,
    zoomAuthenticated: tutor.zoomAuthenticated || false,
    zoomUrl: tutor.zoomUrl || "",
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        form.append(key, String(val));
      });
      await updateTutor(tutor.id, form);
      toast({ title: "تم تحديث بيانات المعلم" });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.log(error);

      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تعديل بيانات المعلم</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>المنطقة الزمنية</Label>
              <Select
                value={formData.timezone}
                onValueChange={(v) => handleChange("timezone", v)}
              >
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
          <div className="space-y-2">
            <Label>سعر الحصة ({tutor.currency})</Label>
            <Input
              type="number"
              value={formData.pricePerSession}
              onChange={(e) => handleChange("pricePerSession", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>النبذة التعريفية</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>المؤهلات</Label>
            <Textarea
              value={formData.qualifications}
              onChange={(e) => handleChange("qualifications", e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(v) => handleChange("active", v)}
            />
            <Label htmlFor="active">نشط</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="zoom"
              checked={formData.zoomAuthenticated}
              onCheckedChange={(v) => handleChange("zoomAuthenticated", v)}
            />
            <Label htmlFor="zoom">مفعل على Zoom</Label>
          </div>
          {formData.zoomAuthenticated && (
            <div className="space-y-2">
              <Label>رابط Zoom الشخصي</Label>
              <Input
                value={formData.zoomUrl}
                onChange={(e) => handleChange("zoomUrl", e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
