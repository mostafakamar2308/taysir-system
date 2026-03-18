"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TutorProfile } from "@/types/tutor";
import { dayLabels } from "@/lib/enums";

interface AvailabilityTabProps {
  tutor: TutorProfile;
}

export default function AvailabilityTab({ tutor }: AvailabilityTabProps) {
  const { toast } = useToast();
  const [addAvailOpen, setAddAvailOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">الأوقات المتاحة الأسبوعية</CardTitle>
          <Button size="sm" onClick={() => setAddAvailOpen(true)}>
            <Plus className="h-4 w-4" /> إضافة وقت
          </Button>
        </CardHeader>
        <CardContent>
          {tutor.availabilities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لم يتم تحديد أوقات متاحة
            </p>
          ) : (
            <div className="space-y-2">
              {tutor.availabilities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{dayLabels[a.dayOfWeek]}</Badge>
                    <span className="text-sm">
                      {a.startTime} – {a.endTime}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toast({ title: "تعديل" })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toast({ title: "حذف" })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addAvailOpen} onOpenChange={setAddAvailOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة وقت متاح</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اليوم</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر اليوم" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dayLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>من</Label>
                <Input type="time" />
              </div>
              <div>
                <Label>إلى</Label>
                <Input type="time" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAvailOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                toast({ title: "تمت الإضافة" });
                setAddAvailOpen(false);
              }}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
