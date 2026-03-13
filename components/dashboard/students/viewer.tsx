"use client";

import { useState, useMemo, useCallback } from "react";
import StudentCard from "@/components/dashboard/students/studentCard";
import StatsCards from "@/components/dashboard/students/statsCard";
import ViewToggle from "@/components/dashboard/common/viewToggle";
import { Download, Filter, GraduationCap, Search } from "lucide-react";
import { DashboardStudent } from "@/types/student";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plan } from "@/generated/prisma/browser";
import { SortDir, SortField } from "@/types/lib";
import { exportStudentsToCSV } from "@/lib/export";
import FilterPanel from "@/components/dashboard/common/filterPanel";
import BulkActionsBar from "@/components/dashboard/students/bulkActionBar";
import { StudentTable } from "@/components/dashboard/students/studenTable";
import { EmptyState } from "@/components/dashboard/students/emptyState";
import AddStudentDialog from "@/components/dashboard/students/addStudentDialog";

interface StudentsClientProps {
  students: DashboardStudent[];
  plans: Plan[];
  tutors: { id: number; name: string }[];
  academyId: number;
}

const statusLabels: Record<number, string> = {
  0: "تجريبي",
  1: "مشترك",
  2: "عميل محتمل",
  3: "منسحب",
  4: "متوقف",
};

const statusColors: Record<number, string> = {
  0: "bg-blue-100 text-blue-700",
  1: "bg-green-100 text-green-700",
  2: "bg-amber-100 text-amber-700",
  3: "bg-red-100 text-red-700",
  4: "bg-gray-100 text-gray-700",
};

const StudentsViewer = ({
  students,
  plans,
  tutors,
  academyId,
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
  const planFilter = searchParams.get("plan") || "";
  const sortField = (searchParams.get("sort") as SortField) || "name";
  const sortDir = (searchParams.get("dir") as SortDir) || "asc";

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
    router.push("?", { scroll: false });
  }, [router]);

  const filterOptions = useMemo(
    () => ({
      tutors: Array.from(new Set(students.map((s) => s.tutorName))).filter(
        Boolean,
      ),
      countries: Array.from(new Set(students.map((s) => s.country))).filter(
        Boolean,
      ),
      statuses: Object.entries(statusLabels).map(([value, label]) => ({
        value,
        label,
      })),
      plans: plans.map((plan) => ({
        label: plan.title,
        value: String(plan.id),
      })),
    }),
    [students, plans],
  );

  const filteredStudents = useMemo(() => {
    const result = students.filter((s) => {
      if (
        search &&
        !s.name.includes(search) &&
        !s.email.includes(search) &&
        !s.tutorName.includes(search)
      )
        return false;
      if (statusFilter && s.status.toString() !== statusFilter) return false;
      if (tutorFilter && s.tutorName !== tutorFilter) return false;
      if (countryFilter && s.country !== countryFilter) return false;
      if (planFilter && String(s.plan) !== planFilter) return false;
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name, "ar");
          break;
        case "age":
          cmp = a.age - b.age;
          break;
        case "status":
          cmp = a.status - b.status;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [
    students,
    search,
    statusFilter,
    tutorFilter,
    countryFilter,
    planFilter,
    sortField,
    sortDir,
  ]);

  const activeFilterCount = [
    statusFilter,
    tutorFilter,
    countryFilter,
    planFilter,
  ].filter(Boolean).length;

  const toggleSort = (field: SortField) => {
    console.log({ field, sortField });

    if (sortField === field) {
      console.log("Here");

      setParam("dir", sortDir === "asc" ? "desc" : "asc");
    } else {
      console.log("Here 2");
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
    if (selected.size === filteredStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredStudents.map((s) => String(s.id))));
    }
  };

  const handleExport = () => {
    exportStudentsToCSV(filteredStudents);
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
            {students.length} طالب مسجل
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
              className="pr-9 w-55"
              value={search}
              onChange={(e) => setParam("q", e.target.value)}
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
          filterOptions={filterOptions}
          currentFilters={{
            status: statusFilter,
            tutor: tutorFilter,
            country: countryFilter,
            plan: planFilter,
            speciality: "",
          }}
          onFilterChange={setParam}
          onClear={clearFilters}
          activeCount={activeFilterCount}
        />
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <BulkActionsBar
          selectedCount={selected.size}
          onClearSelection={() => setSelected(new Set())}
        />
      )}

      <StatsCards
        students={students}
        currentStatusFilter={statusFilter}
        onStatusClick={(status) =>
          setParam("status", status === statusFilter ? "" : status)
        }
        statusLabels={statusLabels}
        statusColors={statusColors}
      />

      {filteredStudents.length === 0 ? (
        <EmptyState
          hasFilters={activeFilterCount > 0 || !!search}
          onClear={clearFilters}
        />
      ) : view === "cards" ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredStudents.length} نتيجة
            </p>
            {/* <SortDropdown
              sortField={sortField}
              sortDir={sortDir}
              onSort={toggleSort}
            /> */}
            <AddStudentDialog
              tutors={tutors}
              plans={plans}
              academyId={academyId}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </>
      ) : (
        <StudentTable
          students={filteredStudents}
          selected={selected}
          onSelect={toggleSelect}
          onSelectAll={toggleSelectAll}
          sortField={sortField}
          sortDir={sortDir}
          onSort={toggleSort}
        />
      )}
    </div>
  );
};

export default StudentsViewer;
