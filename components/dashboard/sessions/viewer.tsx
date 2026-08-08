"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "@/lib/dayjs";
import type { AdminSession } from "@/types/session";
import { WeeklyCalendarView } from "./WeeklyCalendarView";
import { MobileSessionsList } from "./MobileSessionsList";
import { SessionDetailPanel } from "./SessionDetailPanel";
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
  Filter,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddSessionDialog } from "./AddSessionDialog";
import { EditSessionDialog } from "./EditSessionDialog";
import { CancelSessionDialog } from "./CancelSessionDialog";

interface Props {
  initialSessions: AdminSession[];
  initialWeekStart: string; // YYYY-MM-DD (Saturday)
  academyId: number;
}

export default function SessionsViewer({
  initialSessions,
  initialWeekStart,
  academyId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Week navigation – the Saturday that starts the displayed week
  const [saturday, setSaturday] = useState(
    dayjs(initialWeekStart).startOf("day"),
  );

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all"); // all, 0,1,2
  const [trialFilter, setTrialFilter] = useState("all"); // all, true, false
  const [missingAttendance, setMissingAttendance] = useState(false);
  const [missingReports, setMissingReports] = useState(false);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AdminSession | null>(
    null,
  );
  const [cancelSession, setCancelSession] = useState<AdminSession | null>(null);

  // Session detail dialog
  const [selectedSession, setSelectedSession] = useState<AdminSession | null>(
    null,
  );

  // Week dates (Saturday → Friday)
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(saturday.add(i, "day").toDate());
    }
    return dates;
  }, [saturday]);

  // Client‑side filtering
  const filteredSessions = useMemo(() => {
    return initialSessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== parseInt(statusFilter))
        return false;
      if (trialFilter === "true" && !s.isTrial) return false;
      if (trialFilter === "false" && s.isTrial) return false;

      if (missingAttendance) {
        const hasMissing = s.participants.some((p) => p.status == null);
        if (!hasMissing) return false;
      }
      if (missingReports) {
        const hasMissing = s.participants.some(
          (p) =>
            p.status !== null &&
            [0, 3].includes(p.status) && // ATTENDED or LATE
            p.report == null,
        );
        if (!hasMissing) return false;
      }
      return true;
    });
  }, [
    initialSessions,
    statusFilter,
    trialFilter,
    missingAttendance,
    missingReports,
  ]);

  // Navigation
  const navigate = (dir: number) => {
    const newSaturday = saturday.add(dir * 7, "day");
    setSaturday(newSaturday);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", newSaturday.format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const goToday = () => {
    const today = dayjs();
    const newSaturday = today.startOf("week").subtract(1, "day");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الحصص</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض وإدارة جميع الحصص في التقويم الأسبوعي
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة حصة
        </Button>
      </div>

      {/* Navigation & Filters */}
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
          {/* Status filter */}
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

          {/* Trial filter */}
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

          {/* Missing attendance toggle */}
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

          {/* Missing reports toggle */}
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

      {/* Calendar / Mobile */}
      <div className="hidden md:block">
        <WeeklyCalendarView
          weekDates={weekDates}
          sessions={filteredSessions}
          onSessionClick={setSelectedSession}
          onEditSession={setEditingSession}
          onCancelSession={setCancelSession}
        />
      </div>
      <div className="block md:hidden">
        <MobileSessionsList
          weekDates={weekDates}
          sessions={filteredSessions}
          onSessionClick={setSelectedSession}
          onEditSession={setEditingSession}
          onCancelSession={setCancelSession}
        />
      </div>

      {/* Session detail panel */}
      {selectedSession && (
        <SessionDetailPanel
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => {
            if (!open) setSelectedSession(null);
          }}
        />
      )}

      <AddSessionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        academyId={academyId}
      />
      {editingSession && (
        <EditSessionDialog
          open={!!editingSession}
          onOpenChange={(open) => {
            if (!open) setEditingSession(null);
          }}
          session={editingSession}
          academyId={academyId}
        />
      )}
      <CancelSessionDialog
        open={cancelSession !== null}
        onOpenChange={() => setCancelSession(null)}
        sessionId={cancelSession?.id || 0}
      />
    </div>
  );
}
