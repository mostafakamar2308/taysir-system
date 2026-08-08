"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import StudentCard from "@/components/dashboard/students/studentCard";
import StatsCards from "@/components/dashboard/students/statsCard";
import ViewToggle from "@/components/dashboard/common/viewToggle";
import { Download, Filter, GraduationCap, Search } from "lucide-react";
import type { DashboardStudent } from "@/types/student";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Currency } from "@/generated/prisma/browser";
import type { SortDir, SortField } from "@/types/lib";
import { exportStudentsToCSV } from "@/lib/export";
import FilterPanel from "@/components/dashboard/common/filterPanel";
import BulkActionsBar from "@/components/dashboard/students/bulkActionBar";
import { StudentTable } from "@/components/dashboard/students/studenTable";
import { EmptyState } from "@/components/dashboard/students/emptyState";
import AddStudentDialog from "@/components/dashboard/dialogs/addStudentDialog";
import { statusColors, statusLabels } from "@/lib/enums";

interface StudentsClientProps {
  students: DashboardStudent[];
  currencies: Currency[];
  tutors: { id: number; name: string }[];
  academyId: number;
  filterOptions: {
    countries: string[];
    groups: { value: string; label: string }[];
  };
  statusCounts: Record<number, number>;
  totalStudents: number;
}

const StudentsViewer = ({
  students,
  tutors,
  academyId,
  currencies,
  filterOptions,
  statusCounts,
  totalStudents,
}: StudentsClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const search = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";
  const tutorFilter = searchParams.get("tutor") || "";
  const countryFilter = searchParams.get("country") || "";
  const groupFilter = searchParams.get("group") || "";
  const sortField = (searchParams.get("sort") as SortField) || "name";
  const sortDir = (searchParams.get("dir") as SortDir) || "asc";
  const [searchInput, setSearchInput] = useState(search);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    router.push("?", { scroll: false });
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) setParam("q", searchInput);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput, search, setParam]);

  const activeFilterCount = [
    statusFilter,
    tutorFilter,
    countryFilter,
    groupFilter,
  ].filter(Boolean).length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setParam("dir", sortDir === "asc" ? "desc" : "asc");
    } else {
      setParam("sort", field);
      setParam("dir", "asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => String(s.id))));
    }
  };

  const handleExport = () => {
    exportStudentsToCSV(students);
  };

  const selectedIds = useMemo(() => {
    return Array.from(selected).map((id) => parseInt(id));
  }, [selected]);

  const handleBulkActionSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            الطلاب
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalStudents} طالب مسجل
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
              className="pr-9 w-55"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {showFilters && (
        <FilterPanel
          filterOptions={{
            tutors: tutors
              .map((t) => ({ value: String(t.id), label: t.name }))
              .filter((t) => t.label),
            countries: filterOptions.countries,
            groups: filterOptions.groups,
            statuses: Object.entries(statusLabels).map(([value, label]) => ({
              value,
              label,
            })),
            plans: [],
            specialities: [],
          }}
          currentFilters={{
            status: statusFilter,
            tutor: tutorFilter,
            country: countryFilter,
            plan: "",
            group: groupFilter,
            speciality: "",
          }}
          onFilterChange={setParam}
          onClear={clearFilters}
          activeCount={activeFilterCount}
        />
      )}

      {selected.size > 0 && (
        <BulkActionsBar
          selectedCount={selected.size}
          selectedIds={selectedIds}
          tutors={tutors}
          onClearSelection={() => setSelected(new Set())}
          onSuccess={handleBulkActionSuccess}
        />
      )}

      <StatsCards
        counts={statusCounts}
        currentStatusFilter={statusFilter}
        onStatusClick={(status) =>
          setParam("status", status === statusFilter ? "" : status)
        }
        statusLabels={statusLabels}
        statusColors={statusColors}
      />

      {students.length === 0 ? (
        <EmptyState
          tutors={tutors}
          currencies={currencies}
          academyId={academyId}
          type={"students"}
          hasFilters={activeFilterCount > 0 || !!search}
          onClear={clearFilters}
        />
      ) : view === "cards" ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {students.length} نتيجة
            </p>
            <AddStudentDialog
              tutors={tutors}
              currencies={currencies}
              academyId={academyId}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                tutors={tutors}
                academyId={academyId}
              />
            ))}
          </div>
        </>
      ) : (
        <StudentTable
          students={students}
          selected={selected}
          onSelect={toggleSelect}
          onSelectAll={toggleSelectAll}
          sortField={sortField}
          sortDir={sortDir}
          onSort={toggleSort}
          tutors={tutors}
        />
      )}
    </div>
  );
};

export default StudentsViewer;
