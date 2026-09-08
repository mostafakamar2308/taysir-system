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
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/actions/sessions";
import { getSessionFormOptions } from "@/actions/sessions";
import dayjs from "@/lib/dayjs";
import { SessionGroup } from "@/types/session";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academyId: number;
  tutorId?: number; // when passed (tutor view), filter to this tutor
}

export function AddSessionDialog({
  open,
  onOpenChange,
  academyId,
  tutorId,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<SessionGroup[]>([]);
  const [tutors, setTutors] = useState<{ name: string | null; id: number }[]>(
    [],
  );
  const [students, setStudents] = useState<
    { id: number; name: string; sessionsRemaining: number | null }[]
  >([]);

  const [mode, setMode] = useState<"group" | "private">("group");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedTutorId, setSelectedTutorId] = useState<string>(
    tutorId ? String(tutorId) : "",
  );
  const [originalTutorId, setOriginalTutorId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");
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
          setSelectedTutorId(tutorId ? String(tutorId) : "");
          setOriginalTutorId(null);
          setSelectedStudentId("");
          setDate(dayjs().format("YYYY-MM-DD"));
          setStartTime("09:00");
          setDuration(60);
          setTopic("");
          setNotes("");
          setZoomUrl("");
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

  const tutorMismatch =
    mode === "group" &&
    selectedTutorId &&
    originalTutorId !== null &&
    parseInt(selectedTutorId) !== originalTutorId;

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value);
    const group = groups.find((g) => g.id === parseInt(value));
    if (group) {
      setSelectedTutorId(group.tutorId.toString());
      setOriginalTutorId(group.tutorId);
    }
  };

  const handleTutorChange = (value: string) => {
    setSelectedTutorId(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "group" && !selectedGroupId) return;
    if (mode === "private" && (!selectedStudentId || !selectedTutorId)) return;
    setLoading(true);
    try {
      const startISO = dayjs(`${date}T${startTime}`).utc().toISOString();
      if (mode === "group") {
        const res = await createSession({
          groupId: parseInt(selectedGroupId),
          tutorId: parseInt(selectedTutorId),
          date,
          startTime: startISO,
          duration,
          topic: topic || undefined,
          notes: notes || undefined,
          isTrial,
          zoomUrl: zoomUrl || undefined,
        });
        if (!res.ok) throw new Error(res.error);
      } else {
        const res = await createSession({
          studentId: parseInt(selectedStudentId),
          tutorId: parseInt(selectedTutorId),
          date,
          startTime: startISO,
          duration,
          topic: topic || undefined,
          notes: notes || undefined,
          isTrial,
          zoomUrl: zoomUrl || undefined,
        });
        if (!res.ok) throw new Error(res.error);
      }
      toast({ title: "تم إنشاء الحصة" });
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
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة حصة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <>
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
                <Label>المعلم</Label>
                <Combobox
                  options={tutors.map((t) => ({
                    value: t.id.toString(),
                    label: t.name ?? "",
                  }))}
                  value={selectedTutorId}
                  onValueChange={handleTutorChange}
                  placeholder="اختر المعلم"
                  disabled={!!tutorId}
                />
                {tutorMismatch && (
                  <Alert
                    variant="warning"
                    className="mt-2 border-amber-300 bg-amber-50 dark:bg-amber-900/10"
                  >
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
                      لقد اخترت معلماً مختلفاً عن معلم المجموعة. هذا التغيير
                      سيُطبق على هذه الحصة فقط.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
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
                  disabled={!!tutorId}
                />
              </div>
            </>
          )}

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
                يُنصح بتجديد الاشتراك.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>وقت البدء *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
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

          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>رابط Zoom (اختياري)</Label>
            <Input
              type="url"
              dir="ltr"
              placeholder="https://..."
              value={zoomUrl}
              onChange={(e) => setZoomUrl(e.target.value)}
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
              حصة تجريبية
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
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
