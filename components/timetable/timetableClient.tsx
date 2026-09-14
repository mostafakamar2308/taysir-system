"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Plus, Repeat, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createRecurringSchedule,
  deleteRecurringSchedule,
} from "@/actions/recurringSchedule";
import { dayOfWeekLabels } from "@/types/session";
import dayjs from "@/lib/dayjs";

export interface TimetableItem {
  id: number;
  groupId: number;
  groupName: string;
  tutorId: number;
  tutorName: string;
  dayOfWeek: number;
  startTime: string; // HH:mm
  durationMinutes: number;
  topic: string | null;
  endDate: string | null; // YYYY-MM-DD
  nextOccurrence: string | null; // YYYY-MM-DD
}

export interface GroupOption {
  id: number;
  title: string;
  tutorId: number;
  tutorName: string;
}

interface Props {
  role: "admin" | "tutor" | "supervisor";
  schedules: TimetableItem[];
  groupOptions: GroupOption[];
  canCreate: boolean;
}

const dayOptions = Object.entries(dayOfWeekLabels).map(([value, label]) => ({
  value,
  label,
}));

const subtitles: Record<Props["role"], string> = {
  admin: "جميع الجداول المتكررة في الأكاديمية",
  tutor: "جداولك المتكررة",
  supervisor: "الجداول المتكررة للمعلمين تحت إشرافك",
};

function ScheduleCard({
  schedule,
  showTutor,
  onDelete,
}: {
  schedule: TimetableItem;
  showTutor: boolean;
  onDelete: () => void;
}) {
  const endTime = dayjs(`${schedule.startTime}`, "HH:mm")
    .add(schedule.durationMinutes, "minute")
    .format("HH:mm");
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 space-y-1.5 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-primary tabular-nums">
          {schedule.startTime} – {endTime}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="font-medium leading-tight truncate">{schedule.groupName}</p>
      {showTutor && (
        <p className="text-xs text-muted-foreground truncate">
          {schedule.tutorName}
        </p>
      )}
      {schedule.topic && (
        <p className="text-xs text-muted-foreground truncate" title={schedule.topic}>
          {schedule.topic}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {schedule.durationMinutes} دقيقة
        </Badge>
        {schedule.nextOccurrence && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
          >
            القادمة: {dayjs(schedule.nextOccurrence).format("D MMMM")}
          </Badge>
        )}
        {schedule.endDate && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            ينتهي: {dayjs(schedule.endDate).format("D MMMM YYYY")}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function TimetableClient({
  role,
  schedules,
  groupOptions,
  canCreate,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("16:00");
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState("");
  const [endDate, setEndDate] = useState("");

  const byDay = useMemo(() => {
    const buckets: TimetableItem[][] = Array.from({ length: 7 }, () => []);
    for (const s of schedules) {
      buckets[s.dayOfWeek]?.push(s);
    }
    for (const bucket of buckets) {
      bucket.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return buckets;
  }, [schedules]);

  const showTutor = role !== "tutor";

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value);
    const group = groupOptions.find((g) => g.id === parseInt(value));
    if (group) setSelectedTutorId(group.tutorId.toString());
  };

  const handleDayToggle = (dayValue: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue],
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedTutorId || selectedDays.length === 0)
      return;
    setLoading(true);
    try {
      for (const dayStr of selectedDays) {
        const res = await createRecurringSchedule({
          groupId: parseInt(selectedGroupId),
          tutorId: parseInt(selectedTutorId),
          dayOfWeek: parseInt(dayStr),
          startTime,
          durationMinutes: duration,
          topic: topic || undefined,
          endDate: endDate || null,
        });
        if (!res.ok) {
          toast({
            title: "خطأ",
            description: res.error,
            variant: "destructive",
          });
          return;
        }
      }
      toast({ title: "تم إنشاء الجداول المتكررة" });
      setSelectedGroupId("");
      setSelectedTutorId("");
      setSelectedDays([]);
      setStartTime("16:00");
      setDuration(60);
      setTopic("");
      setEndDate("");
      setFormOpen(false);
      router.refresh();
    } catch {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (schedule: TimetableItem) => {
    if (
      !window.confirm(
        `حذف الجدول المتكرر (${schedule.groupName} — ${dayOfWeekLabels[schedule.dayOfWeek]} ${schedule.startTime})؟`,
      )
    )
      return;
    const res = await deleteRecurringSchedule(schedule.id);
    if (!res.ok) {
      toast({ title: "خطأ", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "تم حذف الجدول المتكرر" });
    router.refresh();
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            الجداول المتكررة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitles[role]}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Repeat className="h-4 w-4" />
            إضافة جدول جديد
          </Button>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة جدول جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>المجموعة *</Label>
              <Combobox
                options={groupOptions.map((g) => ({
                  value: g.id.toString(),
                  label: `${g.title} — ${g.tutorName}`,
                }))}
                value={selectedGroupId}
                onValueChange={handleGroupChange}
                placeholder="اختر المجموعة"
              />
            </div>

            <div className="space-y-2">
              <Label>أيام الأسبوع *</Label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => handleDayToggle(day.value)}
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
              {selectedDays.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  اختر يوماً واحداً على الأقل
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وقت البدء *</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>المدة (دقيقة)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  min={15}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الموضوع</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="اختياري"
              />
            </div>

            <div className="space-y-2">
              <Label>تاريخ الانتهاء (اختياري)</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={dayjs().format("YYYY-MM-DD")}
              />
              <p className="text-xs text-muted-foreground">
                اتركه فارغاً للتكرار بشكل لا نهائي
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={
                  loading || !selectedGroupId || selectedDays.length === 0
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Repeat className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">لا توجد جداول متكررة بعد</p>
          {canCreate && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFormOpen(true)}
            >
              إضافة جدول جديد
            </Button>
          )}
        </div>
      ) : (
        /* Weekly grid (desktop) */
        <div className="hidden md:grid grid-cols-7 gap-2.5">
          {byDay.map((items, dayIdx) => (
            <div
              key={dayIdx}
              className="rounded-xl border border-border bg-card/60 p-2 min-h-40"
            >
              <div className="text-center pb-2 mb-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground">
                  {dayOfWeekLabels[dayIdx]}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {items.length} جدول
                </p>
              </div>
              <div className="space-y-2">
                {items.map((s) => (
                  <ScheduleCard
                    key={s.id}
                    schedule={s}
                    showTutor={showTutor}
                    onDelete={() => handleDelete(s)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile grouped list */}
      <div className="md:hidden space-y-4">
        {byDay.map((items, dayIdx) =>
          items.length === 0 ? null : (
            <div key={dayIdx}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">
                  {dayOfWeekLabels[dayIdx]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {items.length} جدول
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {items.map((s) => (
                  <ScheduleCard
                    key={s.id}
                    schedule={s}
                    showTutor={showTutor}
                    onDelete={() => handleDelete(s)}
                  />
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}