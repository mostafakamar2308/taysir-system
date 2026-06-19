"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/actions/sessions";
import { Plus } from "lucide-react";
import dayjs from "@/lib/dayjs";

interface StudentOption {
  id: number;
  name: string;
  balance: number;
}

interface AddSessionDialogProps {
  tutors: { id: number; name: string | null }[];
  students: StudentOption[];
  children?: React.ReactNode;
}

export default function AddSessionDialog({
  tutors,
  students,
  children,
}: AddSessionDialogProps) {
  const t = useTranslations("AddSessionDialog");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [tutorId, setTutorId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isTrial, setIsTrial] = useState(false);

  // Build multi-select options, disable students with no balance unless trial
  const multiSelectOptions = useMemo(() => {
    return students.map((s) => ({
      value: String(s.id),
      label: `${s.name} (${s.balance} ${t("sessionsLeft")})`,
      disabled: !isTrial && s.balance < 1,
      balance: s.balance,
    }));
  }, [students, isTrial, t]);

  // When trial toggles, remove invalid selections
  const handleTrialToggle = (checked: boolean) => {
    setIsTrial(checked);
    if (!checked) {
      setSelectedStudentIds((prev) =>
        prev.filter((id) => {
          const student = students.find((s) => String(s.id) === id);
          return student && student.balance >= 1;
        }),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudentIds.length === 0 || !tutorId || !date || !startTime) {
      toast({ title: t("validation.required"), variant: "destructive" });
      return;
    }

    // Balance check (defensive)
    if (!isTrial) {
      const selected = students.filter((s) =>
        selectedStudentIds.includes(String(s.id)),
      );
      const lowBalance = selected.filter((s) => s.balance < 1);
      if (lowBalance.length > 0) {
        toast({
          title: t("validation.noBalance", {
            names: lowBalance.map((s) => s.name).join("، "),
          }),
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const start = dayjs(`${date}T${startTime}`).utc();
      await createSession({
        studentIds: selectedStudentIds.map(Number),
        tutorId,
        date,
        startTime: start.toISOString(),
        duration: parseInt(duration),
        topic: topic || undefined,
        notes: notes || undefined,
        isTrial,
      });

      toast({ title: t("toast.success") });
      router.refresh();
      setOpen(false);
      // Reset form
      setSelectedStudentIds([]);
      setTutorId(0);
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setDuration("60");
      setTopic("");
      setNotes("");
      setIsTrial(false);
    } catch (error) {
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
          {/* Student selection – multi */}
          <div className="space-y-2">
            <Label>{t("students")} *</Label>
            <MultiSelect
              options={multiSelectOptions}
              selected={selectedStudentIds}
              onChange={setSelectedStudentIds}
              placeholder={t("studentPlaceholder")}
              searchPlaceholder={t("searchPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("studentHint")}</p>
          </div>

          {/* Tutor selection */}
          <div className="space-y-2">
            <Label>{t("tutor")} *</Label>
            <Select
              value={tutorId ? String(tutorId) : ""}
              onValueChange={(val) => setTutorId(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("tutorPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((tut) => (
                  <SelectItem key={tut.id} value={String(tut.id)}>
                    {tut.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trial toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">{t("trialSession")}</Label>
            <Switch checked={isTrial} onCheckedChange={handleTrialToggle} />
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
