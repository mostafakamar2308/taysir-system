"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Plus,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { SessionFormDialog } from "./sessionFormDialog";
import { SessionDetailPanel } from "./sessionDetailPanel";
import { DeleteSessionDialog } from "./deleteSessionDialog";
import { getWeekDates, utcToLocalDate, utcToLocalTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import { SessionStatus, DashboardSession } from "@/types/session";
import dayjs from "@/lib/dayjs";

interface Props {
  initialSessions: DashboardSession[];
  initialWeekStart: string;
  students: { id: number; name: string }[];
  tutors: { id: number; name: string | null }[];
}

// Time slots (7am to 7pm)
const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 7;
  return { hour, label: `${hour.toString().padStart(2, "0")}:00` };
});

const dayNamesShort = [
  "أحد",
  "اثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
  "سبت",
];

export default function SessionsViewer({
  initialSessions,
  initialWeekStart,
  students,
  tutors,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State
  const [sessions, setSessions] = useState(initialSessions);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(() =>
    dayjs(initialWeekStart).toDate(),
  );
  const [filterTutor, setFilterTutor] = useState<string>("all");
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Dialogs
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
  const [prefillSlot, setPrefillSlot] = useState<{
    date: Date;
    hour: number;
  } | null>(null);

  // Compute week dates
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  // Filter sessions
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

  // Sessions in current week
  const weekSessions = useMemo(() => {
    const start = weekDates[0].getTime();
    const end = weekDates[6].getTime() + 24 * 60 * 60 * 1000;
    return filteredSessions.filter((s) => {
      const t = new Date(s.startTime).getTime();
      return t >= start && t < end;
    });
  }, [filteredSessions, weekDates]);

  // Stats
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
  const navigateWeek = (dir: number) => {
    const newDate = dayjs(currentDate)
      .add(dir * 7, "day")
      .toDate();
    setCurrentDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", dayjs(newDate).format("YYYY-MM-DD"));
    router.push(`?${params.toString()}`);
  };

  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", dayjs(today).format("YYYY-MM-DD"));
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

  const handleSaveSession = async () => {
    // This will be called from SessionFormDialog after successful server action
    // We'll just refresh the page to get fresh data
    router.refresh();
  };

  const activeFilterCount = [filterTutor, filterStudent, filterStatus].filter(
    (v) => v !== "all",
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الحصص</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض وإدارة جميع الحصص في التقويم الأسبوعي
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة حصة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "إجمالي الحصص",
            value: weekStats.total,
            color: "text-foreground",
          },
          {
            label: "مجدولة",
            value: weekStats.scheduled,
            color: "text-blue-600",
          },
          {
            label: "مكتملة",
            value: weekStats.completed,
            color: "text-primary",
          },
          {
            label: "ملغاة",
            value: weekStats.cancelled,
            color: "text-destructive",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>
              {loading ? "–" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground mr-2">
            {dayjs(weekDates[0]).format("D MMMM")} –{" "}
            {dayjs(weekDates[6]).format("D MMMM YYYY")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الموضوع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-9 text-sm"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            فلاتر
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border bg-card p-4">
          <Select value={filterTutor} onValueChange={setFilterTutor}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="المعلم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المعلمين</SelectItem>
              {tutors.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="الطالب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الطلاب</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(sessionStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Calendar Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : weekSessions.length === 0 &&
        (filterTutor !== "all" ||
          filterStudent !== "all" ||
          filterStatus !== "all" ||
          searchQuery) ? (
        <EmptyState
          hasFilters
          onClear={() => {
            setFilterTutor("all");
            setFilterStudent("all");
            setFilterStatus("all");
            setSearchQuery("");
          }}
        />
      ) : weekSessions.length === 0 ? (
        <EmptyState onAdd={handleAddNew} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
            <div className="p-2" />
            {weekDates.map((date, i) => {
              const isToday = utcToLocalDate(date) === utcToLocalDate(today);
              return (
                <div
                  key={i}
                  className={`p-3 text-center border-r border-border ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">
                    {dayNamesShort[i]}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0 min-h-[64px]"
              >
                <div className="p-2 text-xs text-muted-foreground text-center border-l border-border flex items-start justify-center pt-1">
                  {slot.label}
                </div>
                {weekDates.map((date, dayIdx) => {
                  const cellSessions = weekSessions.filter((s) => {
                    const d = new Date(s.startTime);
                    return (
                      d.getDate() === date.getDate() &&
                      d.getMonth() === date.getMonth() &&
                      d.getHours() === slot.hour
                    );
                  });
                  const isToday =
                    utcToLocalDate(date) === utcToLocalDate(today);
                  const isPast =
                    date < today ||
                    (utcToLocalDate(date) === utcToLocalDate(today) &&
                      slot.hour < new Date().getHours());

                  return (
                    <div
                      key={dayIdx}
                      className={`p-1 border-r border-border cursor-pointer hover:bg-accent/30 transition-colors relative ${
                        isToday ? "bg-primary/[0.02]" : ""
                      } ${isPast ? "opacity-80" : ""}`}
                      onClick={() =>
                        cellSessions.length === 0 &&
                        handleSlotClick(date, slot.hour)
                      }
                    >
                      {cellSessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionClick(session);
                          }}
                          className={`w-full text-right rounded-lg p-1.5 mb-1 text-[0.7rem] leading-tight border transition-all hover:shadow-md ${
                            sessionStatusColors[session.status as SessionStatus]
                          }`}
                        >
                          <div className="font-semibold truncate">
                            {session.studentName}
                          </div>
                          <div className="opacity-75 truncate">
                            {session.tutorName}
                          </div>
                          <div className="opacity-60 flex items-center gap-1 mt-0.5">
                            {utcToLocalTime(new Date(session.startTime))}
                            {" – "}
                            {utcToLocalTime(new Date(session.endTime))}
                            {session.recurringPatternId && (
                              <RefreshCw className="h-2.5 w-2.5 inline-block" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SessionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        session={editingSession}
        prefillSlot={prefillSlot}
        students={students}
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

      <DeleteSessionDialog
        session={deleteSession}
        onClose={() => setDeleteSession(null)}
        onConfirm={handleDelete}
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
