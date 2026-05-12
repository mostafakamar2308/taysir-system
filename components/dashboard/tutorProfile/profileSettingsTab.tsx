"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TutorProfile } from "@/types/tutor";

interface ProfileSettingsTabProps {
  tutor: TutorProfile;
}

export default function ProfileSettingsTab({ tutor }: ProfileSettingsTabProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>الاسم</Label>
            <Input defaultValue={tutor.name} />
          </div>
          <div>
            <Label>البريد الإلكتروني</Label>
            <Input defaultValue={tutor.email} type="email" />
          </div>
          <div>
            <Label>الهاتف</Label>
            <Input defaultValue={tutor.phone || ""} />
          </div>
          <div>
            <Label>المنطقة الزمنية</Label>
            <Input defaultValue={tutor.timezone} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">المعلومات المهنية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>سعر الساعة ({tutor.currency})</Label>
              <Input defaultValue={String(tutor.pricePerHour)} type="number" />
            </div>
          </div>
          <div>
            <Label>النبذة التعريفية</Label>
            <Textarea defaultValue={tutor.bio || ""} className="min-h-20" />
          </div>
          <div>
            <Label>المؤهلات</Label>
            <Textarea
              defaultValue={tutor.qualifications || ""}
              className="min-h-20"
            />
          </div>
          <div>
            <Label>التخصصات</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tutor.specialities.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}{" "}
                  <XCircle
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toast({ title: "إزالة" })}
                  />
                </Badge>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ title: "إضافة تخصص" })}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label>حالة النشاط</Label>
            <Switch
              defaultChecked={tutor.active}
              onCheckedChange={() => toast({ title: "تم التبديل" })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast({ title: "تم حفظ التغييرات" })}>
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}
