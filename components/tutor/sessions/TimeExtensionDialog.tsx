"use client";

import { useMemo, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createTimeExtensionRequest } from "@/actions/timeExtensionRequests";
import type { AdminSession } from "@/types/session";
import dayjs from "@/lib/dayjs";
import { formatTime } from "@/lib/dates";

const MAX_EXTENSION_MINUTES = 240;

interface Props {
  session: AdminSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeExtensionDialog({ session, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [minutes, setMinutes] = useState(30);
  const [loading, setLoading] = useState(false);

  const started = useMemo(() => {
    if (!session) return false;
    return dayjs(session.startTime).isBefore(dayjs());
  }, [session]);

  const newEndTime = useMemo(() => {
    if (!session) return null;
    return dayjs(session.endTime).add(minutes, "minute");
  }, [session, minutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!Number.isInteger(minutes) || minutes <= 0) {
      toast({ title: "يرجى إدخال مدة صحيحة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await createTimeExtensionRequest(session.id, minutes);
      if (!res.ok) throw new Error(res.error);
      toast({ title: "تم إرسال طلب التمديد بنجاح" });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error)
        toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog key={session.id} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب تمديد مدة الحصة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1 text-sm">
            <p className="font-semibold truncate">{session.groupName}</p>
            <p className="text-muted-foreground truncate">
              {session.tutorName}
            </p>
            <p className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(session.startTime)} – {formatTime(session.endTime)}
            </p>
          </div>

          {!started && (
            <Alert
              variant="destructive"
              className="border-red-300 bg-red-50 dark:bg-red-900/10"
            >
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300 text-xs">
                لا يمكن طلب تمديد الوقت إلا بعد بدء الحصة.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>المدة المطلوب إضافتها (دقيقة)</Label>
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
              min={1}
              max={MAX_EXTENSION_MINUTES}
              disabled={!started}
            />
            {minutes > MAX_EXTENSION_MINUTES && (
              <p className="text-xs text-destructive">
                الحد الأقصى للإضافة {MAX_EXTENSION_MINUTES} دقيقة.
              </p>
            )}
          </div>

          {newEndTime && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">وقت البدء</span>
                <span className="font-medium">{formatTime(session.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">وقت البدء الجديد</span>
                <span className="font-medium">{formatTime(session.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">وقت الانتهاء الحالي</span>
                <span className="font-medium">{formatTime(session.endTime)}</span>
              </div>
              <div className="flex justify-between border-t border-primary/20 pt-1">
                <span className="text-muted-foreground">وقت الانتهاء الجديد</span>
                <span className="font-bold text-primary">
                  {formatTime(newEndTime.toISOString())}
                </span>
              </div>
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
            <Button type="submit" disabled={loading || !started}>
              {loading ? "جاري الإرسال..." : "إرسال الطلب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}