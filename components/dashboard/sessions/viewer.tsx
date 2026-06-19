"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { getWeekDates } from "@/lib/dates";
import { AdminSessionClientData, SessionStatus } from "@/types/session";
import { SessionDetailPanel } from "./sessionDetailPanel";
import { DeleteSessionDialog } from "./deleteSessionDialog";
import AddSessionDialog from "@/components/dashboard/dialogs/addSessionDialog";
import { SessionsHeader } from "@/components/dashboard/sessions/sessionsHeader";
import { WeekStats } from "@/components/dashboard/sessions/weekStats";
import { WeekNavigation } from "@/components/dashboard/sessions/weekNavigation";
import { FiltersPanel } from "@/components/dashboard/sessions/filtersPanel";
import { WeekView } from "@/components/dashboard/sessions/views/weekView";
import { DayView } from "@/components/dashboard/sessions/views/dayView";
import { MonthView } from "@/components/dashboard/sessions/views/monthView";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CalendarDays, Calendar, List, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { deleteSession } from "@/actions/sessions";

interface Props {
  initialSessions: AdminSessionClientData[];
  initialWeekStart: string;
  students: { id: number; name: string; balance: number }[];
  tutors: { id: number; name: string | null }[];
}

type ViewMode = "day" | "week" | "month";

export default function SessionsViewer({
  initialSessions,
  initialWeekStart,
  students,
  tutors,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [sessions] = useState<AdminSessionClientData[]>(initialSessions);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(() =>
    dayjs(initialWeekStart).toDate(),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [filterTutor, setFilterTutor] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [detailSession, setDetailSession] =
    useState<AdminSessionClientData | null>(null);
  const [sessionToDelete, setSessionToDelete] =
    useState<AdminSessionClientData | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // Filtering
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterTutor !== "all" && s.tutorId.toString() !== filterTutor)
        return false;
      if (filterStudent !== "all") {
        if (
          !s.participants.some((p) => p.studentId.toString() === filterStudent)
        )
          return false;
      }
      if (filterStatus !== "all" && s.status.toString() !== filterStatus)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.studentName.toLowerCase().includes(q) &&
          !(s.tutorName || "").toLowerCase().includes(q) &&
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
    let newDate: Date;
    if (viewMode === "day")
      newDate = dayjs(currentDate).add(dir, "day").toDate();
    else if (viewMode === "week")
      newDate = dayjs(currentDate)
        .add(dir * 7, "day")
        .toDate();
    else newDate = dayjs(currentDate).add(dir, "month").toDate();
    setCurrentDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "week")
      params.set("week", dayjs(newDate).format("YYYY-MM-DD"));
    else if (viewMode === "month")
      params.set("month", dayjs(newDate).format("YYYY-MM"));
    else params.set("day", dayjs(newDate).format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "week")
      params.set("week", dayjs(today).format("YYYY-MM-DD"));
    else if (viewMode === "month")
      params.set("month", dayjs(today).format("YYYY-MM"));
    else params.set("day", dayjs(today).format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  // Session click
  const handleSessionClick = (session: AdminSessionClientData) => {
    setDetailSession(session);
  };

  // Delete flow
  const handleDeleteRequest = (session: AdminSessionClientData) => {
    setDetailSession(null);
    setSessionToDelete(session);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setLoading(true);
    try {
      await deleteSession(sessionToDelete.id);
      toast({ title: "تم إلغاء الحصة بنجاح" });
      router.refresh();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSessionToDelete(null);
    }
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
          onSlotClick={() => {}}
          onSessionClick={handleSessionClick}
        />
      );
    } else if (viewMode === "week") {
      return (
        <WeekView
          weekDates={weekDates}
          sessions={weekSessions}
          onSlotClick={() => {}}
          onSessionClick={handleSessionClick}
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
        <div className="flex items-center gap-2">
          <AddSessionDialog tutors={tutors} students={students}>
            <Button size="sm" className="gap-1">
              <CalendarDays className="h-4 w-4" /> إضافة حصة
            </Button>
          </AddSessionDialog>
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
      </div>

      <WeekStats stats={weekStats} loading={loading} />

      <WeekNavigation
        students={students}
        tutors={tutors}
        viewMode={viewMode}
        currentDate={currentDate}
        onNavigate={navigate}
        onToday={goToday}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        activeFilterCount={activeFilterCount}
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
        <EmptyState />
      ) : (
        renderView()
      )}

      {detailSession && (
        <SessionDetailPanel
          session={detailSession}
          onClose={() => setDetailSession(null)}
          onDelete={handleDeleteRequest}
        />
      )}

      <DeleteSessionDialog
        session={sessionToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSessionToDelete(null)}
        loading={loading}
      />
    </div>
  );
}

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

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters?: boolean;
  onClear?: () => void;
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
              <RefreshCw className="h-4 w-4" /> مسح الفلاتر
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
        </>
      )}
    </div>
  );
}
