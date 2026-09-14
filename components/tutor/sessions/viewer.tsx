"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { saturdayOfWeek } from "@/lib/dates";
import type { AdminSession, RecurringScheduleSlot } from "@/types/session";
import type { SessionClientData } from "@/types/tutor/session";
import { WeeklyCalendarView } from "@/components/dashboard/sessions/WeeklyCalendarView";
import { MobileSessionsList } from "@/components/dashboard/sessions/MobileSessionsList";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  CalendarPlus,
  LayoutGrid,
  Filter,
  Plus,
  Repeat,
} from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { CardsView } from "./cardsView";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AddSessionDialog } from "./AddSessionDialog";
import { BatchScheduleDialog } from "@/components/dashboard/sessions/BatchScheduleDialog";
import { EditSessionDialog } from "@/components/dashboard/sessions/EditSessionDialog";
import { CancelSessionDialog } from "@/components/dashboard/sessions/CancelSessionDialog";
import { TimeExtensionDialog } from "./TimeExtensionDialog";
import { materializeRecurringSession } from "@/actions/recurringSchedule";
import SessionDetailPanel from "./sessionDetailPanel";

interface Props {
  initialSessions: AdminSession[];
  initialSessionData: SessionClientData[];
  initialWeekStart: string;
  tutorId: number;
  academyId: number;
  canCreateSessions: boolean;
  canEditSessionTime: boolean;
  initialRecurringSlots?: RecurringScheduleSlot[];
}

export default function TutorSessionsViewer({
  initialSessions,
  initialSessionData,
  initialWeekStart,
  tutorId,
  academyId,
  canCreateSessions,
  canEditSessionTime,
  initialRecurringSlots = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const { toast } = useToast();

  const [saturday, setSaturday] = useState(
    dayjs(initialWeekStart).startOf("day"),
  );
  const [view, setView] = useState<"cards" | "calendar">(
    searchParams.get("view") === "calendar" ? "calendar" : "cards",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [trialFilter, setTrialFilter] = useState("all");
  const [missingAttendance, setMissingAttendance] = useState(false);
  const [missingReports, setMissingReports] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AdminSession | null>(
    null,
  );
  const [cancelSession, setCancelSession] = useState<AdminSession | null>(null);
  const [extendSession, setExtendSession] = useState<AdminSession | null>(null);
  const [detailSession, setDetailSession] = useState<SessionClientData | null>(
    null,
  );
  const [materializing, setMaterializing] = useState<number | null>(null);

  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) dates.push(saturday.add(i, "day").toDate());
    return dates;
  }, [saturday]);

  const recurringSlots = useMemo(() => {
    return initialRecurringSlots.filter((slot) => {
      const slotDate = dayjs(slot.nextOccurrence);
      const weekEndExclusive = saturday.add(7, "day");
      return (
        (slotDate.isSame(saturday, "day") ||
          slotDate.isAfter(saturday, "day")) &&
        slotDate.isBefore(weekEndExclusive, "day")
      );
    });
  }, [initialRecurringSlots, saturday]);

  const handleRecurringSlotClick = async (slot: RecurringScheduleSlot) => {
    if (materializing) return;
    setMaterializing(slot.id);
    try {
      const res = await materializeRecurringSession(
        slot.id,
        slot.nextOccurrence,
      );
      if (!res.ok) {
        toast({ title: "خطأ", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "تم إنشاء الحصة" });
      router.refresh();
    } catch {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setMaterializing(null);
    }
  };

  const filteredSessions = useMemo(() => {
    return initialSessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== parseInt(statusFilter))
        return false;
      if (trialFilter === "true" && !s.isTrial) return false;
      if (trialFilter === "false" && s.isTrial) return false;
      if (missingAttendance && !s.participants.some((p) => p.status == null))
        return false;
      if (
        missingReports &&
        !s.participants.some(
          (p) =>
            p.status !== null && [0, 3].includes(p.status) && p.report == null,
        )
      )
        return false;
      return true;
    });
  }, [
    initialSessions,
    statusFilter,
    trialFilter,
    missingAttendance,
    missingReports,
  ]);

  const navigate = (dir: number) => {
    const newSaturday = saturday.add(dir * 7, "day");
    setSaturday(newSaturday);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", newSaturday.format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const goToday = () => {
    const today = dayjs();
    const newSaturday = dayjs(saturdayOfWeek(today));
    setSaturday(newSaturday);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", newSaturday.format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const formatWeekLabel = () => {
    const start = saturday.format("D MMMM");
    const end = saturday.add(6, "day").format("D MMMM YYYY");
    return `${start} – ${end}`;
  };

  return (
    <div className="space-y-4 p-4 md:p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الحصص</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض وإدارة جميع حصصك في التقويم الأسبوعي
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (!value) return;
              setView(value as "cards" | "calendar");
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", value);
              router.push(`?${params.toString()}`);
            }}
            size="sm"
            className="border rounded-md p-0.5 bg-background"
          >
            <ToggleGroupItem value="cards" aria-label="عرض البطاقات">
              <LayoutGrid className="h-4 w-4 ml-1" />
              بطاقات
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="عرض التقويم">
              <CalendarDays className="h-4 w-4 ml-1" />
              تقويم
            </ToggleGroupItem>
          </ToggleGroup>
          {canCreateSessions && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" asChild size="sm">
                <Link href={`/${locale}/dashboard/tutor/timetable`}>
                  <Repeat className="h-4 w-4 ml-2" />
                  متكرر
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => setBatchDialogOpen(true)}
                size="sm"
              >
                <CalendarPlus className="h-4 w-4 ml-2" />
                جدولة متعددة
              </Button>
              <Button onClick={() => setAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 ml-2" />
                إضافة حصة
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            اليوم
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground mr-2">
            {formatWeekLabel()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="0">مجدولة</SelectItem>
              <SelectItem value="1">مكتملة</SelectItem>
              <SelectItem value="2">ملغاة</SelectItem>
            </SelectContent>
          </Select>

          <Select value={trialFilter} onValueChange={setTrialFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="التجريبية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="true">تجريبية</SelectItem>
              <SelectItem value="false">عادية</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={missingAttendance ? "default" : "outline"}
            size="sm"
            onClick={() => setMissingAttendance(!missingAttendance)}
            className="gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            حضور
            {missingAttendance && (
              <Badge
                variant="secondary"
                className="h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full"
              >
                1
              </Badge>
            )}
          </Button>

          <Button
            variant={missingReports ? "default" : "outline"}
            size="sm"
            onClick={() => setMissingReports(!missingReports)}
            className="gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            تقارير
            {missingReports && (
              <Badge
                variant="secondary"
                className="h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full"
              >
                1
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {view === "cards" && (
        <CardsView
          weekDates={weekDates}
          sessions={filteredSessions}
          recurringSlots={recurringSlots}
          onSessionClick={(s) =>
            setDetailSession(
              initialSessionData.find((d) => d.id === s.id) ?? null,
            )
          }
          onEditSession={setEditingSession}
          onCancelSession={setCancelSession}
          onExtendSession={setExtendSession}
          onRecurringSlotClick={handleRecurringSlotClick}
        />
      )}

      {view === "calendar" && (
        <>
          <div className="hidden md:block">
            <WeeklyCalendarView
              weekDates={weekDates}
              sessions={filteredSessions}
              recurringSlots={recurringSlots}
              onSessionClick={(s) =>
                setDetailSession(
                  initialSessionData.find((d) => d.id === s.id) ?? null,
                )
              }
              onEditSession={setEditingSession}
              onCancelSession={setCancelSession}
              onExtendSession={setExtendSession}
              onRecurringSlotClick={handleRecurringSlotClick}
            />
          </div>
          <div className="block md:hidden">
            <MobileSessionsList
              weekDates={weekDates}
              sessions={filteredSessions}
              recurringSlots={recurringSlots}
              onSessionClick={(s) =>
                setDetailSession(
                  initialSessionData.find((d) => d.id === s.id) ?? null,
                )
              }
              onEditSession={setEditingSession}
              onCancelSession={setCancelSession}
              onExtendSession={setExtendSession}
              onRecurringSlotClick={handleRecurringSlotClick}
            />
          </div>
        </>
      )}

      {detailSession && (
        <SessionDetailPanel
          session={detailSession}
          open={!!detailSession}
          onOpenChange={(open) => {
            if (!open) setDetailSession(null);
          }}
          onUpdate={() => router.refresh()}
          canEditSessionTime={canEditSessionTime}
          canEditDuration={false}
        />
      )}

      <AddSessionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        academyId={academyId}
        tutorId={tutorId}
      />
      <BatchScheduleDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        academyId={academyId}
        tutorId={tutorId}
      />
      {editingSession && (
        <EditSessionDialog
          open={!!editingSession}
          onOpenChange={(open) => {
            if (!open) setEditingSession(null);
          }}
          session={editingSession}
          academyId={academyId}
          canEditSessionTime={canEditSessionTime}
          canEditDuration={false}
        />
      )}
      <CancelSessionDialog
        open={cancelSession !== null}
        onOpenChange={() => setCancelSession(null)}
        sessionId={cancelSession?.id || 0}
      />
      <TimeExtensionDialog
        session={extendSession}
        open={extendSession !== null}
        onOpenChange={(open) => {
          if (!open) setExtendSession(null);
        }}
      />
    </div>
  );
}
