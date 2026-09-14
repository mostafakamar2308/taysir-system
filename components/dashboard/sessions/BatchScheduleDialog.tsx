"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createMultipleSessions } from "@/actions/sessions";
import { getSessionFormOptions } from "@/actions/sessions";
import { SessionGroup } from "@/types/session";
import dayjs from "@/lib/dayjs";
import { Calendar } from "@/components/ui/calendar";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academyId: number;
  tutorId?: number;
}

export function BatchScheduleDialog({
  open,
  onOpenChange,
  academyId,
  tutorId,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<SessionGroup[]>([]);
  const [tutors, setTutors] = useState<{ id: number; name: string | null }[]>(
    [],
  );
  const [students, setStudents] = useState<
    { id: number; name: string; sessionsRemaining: number | null }[]
  >([]);

  // Form state
  const [mode, setMode] = useState<"group" | "private">("group");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState("16:00");
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState("");
  const [isTrial, setIsTrial] = useState(false);

  useEffect(() => {
    if (open) {
      getSessionFormOptions(academyId, tutorId)
        .then((res) => {
          if (!res.ok || !res.data) return;
          setGroups(res.data.groups);
          setTutors(res.data.tutors);
          setStudents(res.data.students);

          setSelectedGroupId("");
          setSelectedTutorId(tutorId?.toString() ?? "");
          setSelectedStudentId("");
          setSelectedDates([]);
          setStartTime("16:00");
          setDuration(60);
          setTopic("");
          setIsTrial(false);
          setMode("group");
        })
        .catch(console.error);
    }
  }, [open, academyId, tutorId]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === parseInt(selectedGroupId)),
    [groups, selectedGroupId],
  );

  const groupOptions = useMemo(
    () => groups.filter((g) => g.activeMembers.length > 1),
    [groups],
  );

  const lowBalanceStudents = useMemo(() => {
    if (isTrial) return [];
    if (mode === "group" && selectedGroup) {
      return selectedGroup.activeMembers.filter(
        (m) => m.sessionsRemaining != null && m.sessionsRemaining <= 0,
      );
    } else if (mode === "private" && selectedStudentId) {
      const student = students.find(
        (s) => s.id === parseInt(selectedStudentId),
      );
      return student &&
        student.sessionsRemaining != null &&
        student.sessionsRemaining <= 0
        ? [student]
        : [];
    }
    return [];
  }, [isTrial, mode, selectedGroup, selectedStudentId, students]);

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value);
    const group = groups.find((g) => g.id === parseInt(value));
    if (group) {
      setSelectedTutorId(group.tutorId.toString());
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDates((prev) => {
      const exists = prev.some(
        (d) => dayjs(d).format("YYYY-MM-DD") === dayjs(date).format("YYYY-MM-DD"),
      );
      if (exists) {
        return prev.filter(
          (d) => dayjs(d).format("YYYY-MM-DD") !== dayjs(date).format("YYYY-MM-DD"),
        );
      }
      return [...prev, date];
    });
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates((prev) =>
      prev.filter(
        (d) =>
          dayjs(d).format("YYYY-MM-DD") !==
          dayjs(dateToRemove).format("YYYY-MM-DD"),
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) return;
    if (mode === "group" && !selectedGroupId) return;
    if (mode === "private" && (!selectedStudentId || !selectedTutorId)) return;

    setLoading(true);
    try {
      const startTimes = selectedDates.map((d) => {
        const dateStr = dayjs(d).format("YYYY-MM-DD");
        return dayjs(`${dateStr}T${startTime}`).utc().toISOString();
      });
      const input = {
        tutorId: parseInt(selectedTutorId),
        startTimes,
        duration,
        topic: topic || undefined,
        isTrial,
        ...(mode === "group"
          ? { groupId: parseInt(selectedGroupId) }
          : { studentId: parseInt(selectedStudentId) }),
      };

      const res = await createMultipleSessions(input);
      if (!res.ok) throw new Error(res.error);

      const result = res.data;
      if (result.skipped.length > 0) {
        toast({
          title: `تم إنشاء ${result.created.length} حصص`,
          description: `تم تخطي ${result.skipped.length} بسبب: ${result.skipped[0].reason}`,
        });
      } else {
        toast({
          title: `تم إنشاء ${result.created.length} حصص بنجاح`,
        });
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error)
        toast({
          title: "خطأ",
          description: err.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      key={open ? "open" : "closed"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            جدولة حصص متعددة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="group"
                checked={mode === "group"}
                onChange={() => setMode("group")}
              />
              <span>من مجموعة</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="private"
                checked={mode === "private"}
                onChange={() => setMode("private")}
              />
              <span>حصة خاصة (طالب واحد)</span>
            </label>
          </div>

          {mode === "group" ? (
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
          ) : (
            <>
              <div className="space-y-2">
                <Label>الطالب *</Label>
                <Combobox
                  options={students.map((s) => ({
                    value: s.id.toString(),
                    label: s.name,
                  }))}
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  placeholder="اختر الطالب"
                />
              </div>
              <div className="space-y-2">
                <Label>المعلم *</Label>
                <Combobox
                  options={tutors.map((t) => ({
                    value: t.id.toString(),
                    label: t.name ?? "",
                  }))}
                  value={selectedTutorId}
                  onValueChange={setSelectedTutorId}
                  placeholder="اختر المعلم"
                />
              </div>
            </>
          )}

          {/* Low balance warning */}
          {lowBalanceStudents.length > 0 && (
            <Alert
              variant="destructive"
              className="border-red-300 bg-red-50 dark:bg-red-900/10"
            >
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300 text-xs">
                تحذير: الطلاب التاليون لا توجد حصص متبقية في اشتراكهم الحالي:
                <ul className="list-disc list-inside mt-1">
                  {lowBalanceStudents.map((s) => (
                    <li key={s.id}>
                      {s.name} (المتبقي: {s.sessionsRemaining})
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Date picker + selected dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اختر التاريخ (اضغط على عدة تواريخ) *</Label>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(date) => {
                  if (date instanceof Date) {
                    handleDateSelect(date);
                  } else if (Array.isArray(date)) {
                    setSelectedDates(date);
                  }
                }}
                disabled={(date) => dayjs(date).isBefore(dayjs(), "day")}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-2">
              <Label>التواريخ المختارة ({selectedDates.length})</Label>
              {selectedDates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  اضغط على تاريخ في التقويم
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {selectedDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date) => (
                      <Badge
                        key={dayjs(date).format("YYYY-MM-DD")}
                        variant="secondary"
                        className="gap-1"
                      >
                        {dayjs(date).format("YYYY-MM-DD")}
                        <button
                          type="button"
                          onClick={() => removeDate(date)}
                          className="ml-1 cursor-pointer"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Time & Duration */}
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

          {/* Topic */}
          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="يُطبق على جميع الحصص"
            />
          </div>

          {/* Trial */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="trial-batch"
              checked={isTrial}
              onCheckedChange={(v) => setIsTrial(v === true)}
            />
            <Label
              htmlFor="trial-batch"
              className="text-sm font-normal cursor-pointer"
            >
              حصص تجريبية
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedDates.length === 0}
            >
              {loading
                ? "جاري الإنشاء..."
                : `إنشاء ${selectedDates.length} حصة`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
