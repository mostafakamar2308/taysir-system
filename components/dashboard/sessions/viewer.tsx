"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { getWeekDates } from "@/lib/dates";
import { DashboardSession, SessionStatus } from "@/types/session";
import { SessionFormDialog } from "./sessionFormDialog";
import { SessionDetailPanel } from "./sessionDetailPanel";
import { DeleteSessionDialog } from "./deleteSessionDialog";
import AttendanceDialog from "@/components/dashboard/studentProfile/dialogs/attendanceDialog";
import { SessionsHeader } from "@/components/dashboard/sessions/sessionsHeader";
import { WeekStats } from "@/components/dashboard/sessions/weekStats";
import { WeekNavigation } from "@/components/dashboard/sessions/weekNavigation";
import { FiltersPanel } from "@/components/dashboard/sessions/filtersPanel";
import { WeekView } from "@/components/dashboard/sessions/views/weekView";
import { DayView } from "@/components/dashboard/sessions/views/dayView";
import { MonthView } from "@/components/dashboard/sessions/views/monthView";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CalendarDays,
  Calendar,
  List,
  Search,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  initialSessions: DashboardSession[];
  initialWeekStart: string;
  students: { id: number; name: string; tutorId: number | null }[];
  tutors: { id: number; name: string | null }[];
  academyId: number;
}

type ViewMode = "day" | "week" | "month";

export default function SessionsViewer({
  initialSessions,
  initialWeekStart,
  students,
  tutors,
  academyId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [sessions, setSessions] = useState(initialSessions);
  const [loading] = useState(false);
  const [currentDate, setCurrentDate] = useState(() =>
    dayjs(initialWeekStart).toDate(),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [filterTutor, setFilterTutor] = useState<string>("all");
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<DashboardSession | null>(
    null,
  );
  const [detailSession, setDetailSession] = useState<DashboardSession | null>(
    null,
  );
  const [deleteSession, setDeleteSession] = useState<DashboardSession | null>(
    null,
  );
  const [attendanceDialog, setAttendanceDialog] = useState<{
    open: boolean;
    sessionId: number;
    currentStatus?: number;
    currentReason?: string | null;
  }>({ open: false, sessionId: 0 });
  const [prefillSlot, setPrefillSlot] = useState<{
    date: Date;
    hour: number;
  } | null>(null);

  // Derived data
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  // Filtering
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterTutor !== "all" && s.tutorId.toString() !== filterTutor)
        return false;
      if (filterStudent !== "all" && s.studentId.toString() !== filterStudent)
        return false;
      if (filterStatus !== "all" && s.status.toString() !== filterStatus)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.studentName.toLowerCase().includes(q) &&
          !s.tutorName?.toLowerCase().includes(q) &&
          !(s.topic || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [sessions, filterTutor, filterStudent, filterStatus, searchQuery]);

  const weekSessions = useMemo(() => {
    const start = weekDates[0].getTime();
    const end = weekDates[6].getTime() + 24 * 60 * 60 * 1000;
    return filteredSessions.filter((s) => {
      const t = new Date(s.startTime).getTime();
      return t >= start && t < end;
    });
  }, [filteredSessions, weekDates]);

  const weekStats = useMemo(() => {
    const total = weekSessions.length;
    const completed = weekSessions.filter(
      (s) => s.status === SessionStatus.COMPLETED,
    ).length;
    const cancelled = weekSessions.filter(
      (s) => s.status === SessionStatus.CANCELLED,
    ).length;
    const scheduled = weekSessions.filter(
      (s) => s.status === SessionStatus.SCHEDULED,
    ).length;
    return { total, completed, cancelled, scheduled };
  }, [weekSessions]);

  // Navigation
  const navigate = (dir: number) => {
    let newDate;
    if (viewMode === "day") {
      newDate = dayjs(currentDate).add(dir, "day").toDate();
    } else if (viewMode === "week") {
      newDate = dayjs(currentDate)
        .add(dir * 7, "day")
        .toDate();
    } else {
      newDate = dayjs(currentDate).add(dir, "month").toDate();
    }
    setCurrentDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "week") {
      params.set("week", dayjs(newDate).format("YYYY-MM-DD"));
    } else if (viewMode === "month") {
      params.set("month", dayjs(newDate).format("YYYY-MM"));
    } else {
      params.set("day", dayjs(newDate).format("YYYY-MM-DD"));
    }
    router.push(`?${params.toString()}`);
  };

  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "week") {
      params.set("week", dayjs(today).format("YYYY-MM-DD"));
    } else if (viewMode === "month") {
      params.set("month", dayjs(today).format("YYYY-MM"));
    } else {
      params.set("day", dayjs(today).format("YYYY-MM-DD"));
    }
    router.push(`?${params.toString()}`);
  };

  // Handlers
  const handleSlotClick = (date: Date, hour: number) => {
    setPrefillSlot({ date, hour });
    setEditingSession(null);
    setFormOpen(true);
  };

  const handleSessionClick = (session: DashboardSession) => {
    setDetailSession(session);
  };

  const handleAddNew = () => {
    setPrefillSlot(null);
    setEditingSession(null);
    setFormOpen(true);
  };

  const handleEdit = (session: DashboardSession) => {
    setDetailSession(null);
    setEditingSession(session);
    setPrefillSlot(null);
    setFormOpen(true);
  };

  const handleDelete = (session: DashboardSession) => {
    setDetailSession(null);
    setDeleteSession(session);
  };

  const handleSaveSession = () => {
    router.refresh();
  };

  const handleMarkAttendance = (session: DashboardSession) => {
    setAttendanceDialog({
      open: true,
      sessionId: session.id,
      currentStatus: session.attendance?.studentAttendance,
      currentReason: session.attendance?.reason,
    });
  };

  const activeFilterCount = [filterTutor, filterStudent, filterStatus].filter(
    (v) => v !== "all",
  ).length;

  const clearFilters = () => {
    setFilterTutor("all");
    setFilterStudent("all");
    setFilterStatus("all");
    setSearchQuery("");
  };

  const renderView = () => {
    if (viewMode === "day") {
      return (
        <DayView
          date={currentDate}
          sessions={filteredSessions}
          onSlotClick={handleSlotClick}
          onSessionClick={handleSessionClick}
          onMarkAttendance={handleMarkAttendance}
        />
      );
    } else if (viewMode === "week") {
      return (
        <WeekView
          weekDates={weekDates}
          sessions={weekSessions}
          onSlotClick={handleSlotClick}
          onSessionClick={handleSessionClick}
          onMarkAttendance={handleMarkAttendance}
        />
      );
    } else {
      return (
        <MonthView
          date={currentDate}
          sessions={filteredSessions}
          onDayClick={(date) => {
            setCurrentDate(date);
            setViewMode("day");
            const params = new URLSearchParams(searchParams.toString());
            params.set("day", dayjs(date).format("YYYY-MM-DD"));
            router.push(`?${params.toString()}`);
          }}
          onSessionClick={handleSessionClick}
        />
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <SessionsHeader />
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as ViewMode)}
        >
          <ToggleGroupItem value="day" aria-label="Day view">
            <CalendarDays className="h-4 w-4 ml-1" /> يوم
          </ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Week view">
            <Calendar className="h-4 w-4 ml-1" /> أسبوع
          </ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Month view">
            <List className="h-4 w-4 ml-1" /> شهر
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <WeekStats stats={weekStats} loading={loading} />

      <WeekNavigation
        viewMode={viewMode}
        currentDate={currentDate}
        onNavigate={navigate}
        onToday={goToday}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        activeFilterCount={activeFilterCount}
        onAdd={handleAddNew}
      />

      {showFilters && (
        <FiltersPanel
          filterTutor={filterTutor}
          filterStudent={filterStudent}
          filterStatus={filterStatus}
          tutors={tutors}
          students={students}
          onTutorChange={setFilterTutor}
          onStudentChange={setFilterStudent}
          onStatusChange={setFilterStatus}
        />
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (viewMode === "week" &&
          weekSessions.length === 0 &&
          (filterTutor !== "all" ||
            filterStudent !== "all" ||
            filterStatus !== "all" ||
            searchQuery)) ||
        (filteredSessions.length === 0 &&
          (filterTutor !== "all" ||
            filterStudent !== "all" ||
            filterStatus !== "all" ||
            searchQuery)) ? (
        <EmptyState hasFilters onClear={clearFilters} />
      ) : filteredSessions.length === 0 ? (
        <EmptyState onAdd={handleAddNew} />
      ) : (
        renderView()
      )}

      {/* Dialogs */}
      <SessionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        session={editingSession}
        prefillSlot={prefillSlot}
        students={students}
        academyId={academyId}
        tutors={tutors}
        onSave={handleSaveSession}
      />

      {detailSession && (
        <SessionDetailPanel
          session={detailSession}
          onClose={() => setDetailSession(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {deleteSession && (
        <DeleteSessionDialog
          session={deleteSession}
          onClose={() => setDeleteSession(null)}
          onConfirm={handleDelete}
        />
      )}

      <AttendanceDialog
        open={attendanceDialog.open}
        onOpenChange={(open) =>
          setAttendanceDialog({ ...attendanceDialog, open })
        }
        sessionId={attendanceDialog.sessionId}
        currentStatus={attendanceDialog.currentStatus}
        currentReason={attendanceDialog.currentReason}
      />
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full rounded-xl" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

// Empty State
function EmptyState({
  hasFilters,
  onClear,
  onAdd,
}: {
  hasFilters?: boolean;
  onClear?: () => void;
  onAdd?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-card">
      {hasFilters ? (
        <>
          <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-semibold text-foreground">لا توجد نتائج</p>
          <p className="text-sm text-muted-foreground mt-1">
            جرب تغيير الفلاتر أو مصطلح البحث
          </p>
          {onClear && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={onClear}
            >
              <RefreshCw className="h-4 w-4" />
              مسح الفلاتر
            </Button>
          )}
        </>
      ) : (
        <>
          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-semibold text-foreground">
            لا توجد حصص هذا الأسبوع
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ابدأ بإضافة حصص جديدة
          </p>
          {onAdd && (
            <Button size="sm" className="mt-4 gap-2" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              إضافة حصة
            </Button>
          )}
        </>
      )}
    </div>
  );
}
