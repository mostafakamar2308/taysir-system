"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/actions/sessions";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import dayjs from "@/lib/dayjs";
import { useTranslations } from "next-intl";

interface AddSessionDialogProps {
  tutors: { id: number; name: string | null }[];
  students: { id: number; name: string | null }[];
  academyId: number;
  children?: React.ReactNode;
}

export default function AddSessionDialog({
  tutors,
  students,
  academyId,
  children,
}: AddSessionDialogProps) {
  const t = useTranslations("AddSessionDialog");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState(0);
  const [tutorId, setTutorId] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isTrial, setIsTrial] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const [recurEndDate, setRecurEndDate] = useState("");

  const dayOptions = [
    { value: 0, label: t("days.sunday") },
    { value: 1, label: t("days.monday") },
    { value: 2, label: t("days.tuesday") },
    { value: 3, label: t("days.wednesday") },
    { value: 4, label: t("days.thursday") },
    { value: 5, label: t("days.friday") },
    { value: 6, label: t("days.saturday") },
  ];

  const toggleRecurDay = (day: number) => {
    setRecurDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !date || !startTime) {
      toast({
        title: t("validation.required"),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const input = {
        studentId,
        tutorId,
        academyId,
        date,
        startTime: dayjs(`${date}T${startTime}`).toISOString(),
        duration: parseInt(duration),
        topic: topic || undefined,
        notes: notes || undefined,
        isTrial,
        isRecurring,
        recurDays: isRecurring ? recurDays : undefined,
        recurEndDate: isRecurring ? recurEndDate : undefined,
      };
      await createSession(input);
      toast({ title: t("toast.success") });
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.log(error);
      if (error instanceof Error)
        toast({
          title: t("toast.error"),
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> {t("triggerLabel")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("student")} *</Label>
            <Select
              value={studentId.toString()}
              onValueChange={(val) => setStudentId(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("studentPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("tutor")} *</Label>
            <Select
              value={tutorId.toString()}
              onValueChange={(val) => setTutorId(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("tutorPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("date")} *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("startTime")} *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("duration")}</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 20, 25, 30, 45, 60, 90].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {t("durationMinute", { minutes: m })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("topic")}</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("topicPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="trial"
              checked={isTrial}
              onCheckedChange={(v) => setIsTrial(v === true)}
            />
            <Label
              htmlFor="trial"
              className="text-sm font-normal cursor-pointer"
            >
              {t("trialSession")}
            </Label>
          </div>

          {/* Recurring */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                {t("recurringSession")}
              </Label>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("recurringDays")}
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dayOptions.map((d) => (
                      <Badge
                        key={d.value}
                        variant={
                          recurDays.includes(d.value) ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleRecurDay(d.value)}
                      >
                        {d.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("recurringEndDate")}
                  </Label>
                  <Input
                    type="date"
                    value={recurEndDate}
                    onChange={(e) => setRecurEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("saving") : t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
