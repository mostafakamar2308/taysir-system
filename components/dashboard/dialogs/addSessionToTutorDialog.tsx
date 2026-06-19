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
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/actions/sessions";
import { MultiSelect } from "@/components/ui/multi-select";
import { Plus } from "lucide-react";
import dayjs from "@/lib/dayjs";

interface StudentOption {
  id: number;
  name: string;
  balance: number;
}

interface AddSessionDialogProps {
  tutorId: number;
  studentOptions: StudentOption[];
  children?: React.ReactNode;
}

export default function AddSessionDialog({
  tutorId,
  studentOptions,
  children,
}: AddSessionDialogProps) {
  const t = useTranslations("AddSessionToTutorDialog");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isTrial, setIsTrial] = useState(false); // trial sessions skip balance check

  // Build the options for MultiSelect, marking students with low balance
  const multiSelectOptions = useMemo(() => {
    return studentOptions.map((s) => ({
      value: String(s.id),
      label: `${s.name} (${s.balance} ${t("sessionsLeft")})`,
      disabled: !isTrial && s.balance < 1, // can't select if not trial and no balance
      balance: s.balance,
    }));
  }, [studentOptions, isTrial, t]);

  // Filter out disabled options when trial mode changes, clear selection if necessary
  const availableIds = useMemo(
    () =>
      isTrial
        ? studentOptions.map((s) => String(s.id))
        : studentOptions.filter((s) => s.balance >= 1).map((s) => String(s.id)),
    [isTrial, studentOptions],
  );

  // When trial mode changes, remove any invalid selections
  const handleTrialToggle = (checked: boolean) => {
    setIsTrial(checked);
    // Remove selected students who no longer qualify
    if (!checked) {
      setSelectedStudentIds((prev) =>
        prev.filter((id) => availableIds.includes(id)),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudentIds.length === 0 || !date || !startTime) {
      toast({ title: t("validation.missingFields"), variant: "destructive" });
      return;
    }

    // Extra balance check (defensive)
    if (!isTrial) {
      const selected = studentOptions.filter((s) =>
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
            <Plus className="h-4 w-4" /> {t("triggerButton")}
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
            <Label>{t("studentLabel")} *</Label>
            <MultiSelect
              options={multiSelectOptions}
              selected={selectedStudentIds}
              onChange={setSelectedStudentIds}
              placeholder={t("studentPlaceholder")}
              searchPlaceholder={t("searchPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("studentHint")}</p>
          </div>

          {/* Trial switch */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="flex items-center gap-2 text-sm">
              {t("trialLabel")}
            </Label>
            <Switch checked={isTrial} onCheckedChange={handleTrialToggle} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("dateLabel")} *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("startTimeLabel")} *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("durationLabel")}</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 20, 25, 30, 45, 60, 90].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {t("durationMinutes", { minutes: m })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("topicLabel")}</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("topicPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("notesLabel")}</Label>
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
              {t("cancelButton")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("submittingButton") : t("submitButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
