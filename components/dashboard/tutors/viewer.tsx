"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardTutor } from "@/types/tutor";
import { BookOpen, Download, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ViewToggle from "@/components/dashboard/common/viewToggle";
import FilterPanel from "@/components/dashboard/common/filterPanel";
import StatsCards from "@/components/dashboard/tutors/statsCard";
import TutorCard from "@/components/dashboard/tutors/tutorCard";
import TutorTable from "@/components/dashboard/tutors/tutorTable";
import { EmptyState } from "@/components/dashboard/students/emptyState";
import { exportTutorsToCSV } from "@/lib/export";
import { SortField, SortDir } from "@/types/lib";
import AddTutorDialog from "@/components/dashboard/tutors/addTutorDialog";
import { Currency } from "@/generated/prisma/client";

interface TutorsViewerProps {
  tutors: DashboardTutor[];
  specialities: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    title: string;
  }[];
  currencies: Currency[];
  academyId: number;
}

export default function TutorsViewer({
  tutors,
  academyId,
  currencies,
  specialities,
}: TutorsViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<"cards" | "table">("cards");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // URL params
  const search = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || ""; // "active" or "inactive"
  const specialityFilter = searchParams.get("speciality") || "";
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

  // Filter options
  const filterOptions = useMemo(
    () => ({
      statuses: [
        { value: "active", label: "نشط" },
        { value: "inactive", label: "غير نشط" },
      ],
      specialities: Array.from(
        new Set(tutors.flatMap((t) => t.specialities)),
      ).filter(Boolean),
    }),
    [tutors],
  );

  // Filter and sort tutors
  const filteredTutors = useMemo(() => {
    const result = tutors.filter((t) => {
      if (search && !t.name.includes(search) && !t.email.includes(search))
        return false;
      if (statusFilter) {
        const isActive = statusFilter === "active";
        if (t.status !== isActive) return false;
      }
      if (specialityFilter && !t.specialities.includes(specialityFilter))
        return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name, "ar");
          break;
        case "pricePerSession":
          cmp = a.pricePerSession - b.pricePerSession;
          break;
        case "studentCount":
          cmp = a.studentCount - b.studentCount;
          break;
        case "createdAt":
          cmp = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [tutors, search, statusFilter, specialityFilter, sortField, sortDir]);

  const activeFilterCount = [statusFilter, specialityFilter].filter(
    Boolean,
  ).length;

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
    if (selected.size === filteredTutors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredTutors.map((t) => String(t.id))));
    }
  };

  const handleExport = () => {
    exportTutorsToCSV(filteredTutors);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            المعلمين
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tutors.length} معلم · {tutors.filter((t) => t.status).length} نشط
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

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filterOptions={{
            statuses: filterOptions.statuses,
            specialities: filterOptions.specialities.map((s) => ({
              value: s,
              label: s,
            })),
            // we don't have tutors/countries for tutors, so omit or pass empty arrays
            tutors: [],
            countries: [],
            plans: [],
          }}
          currentFilters={{
            status: statusFilter,
            speciality: specialityFilter,
            tutor: "",
            country: "",
            plan: "",
          }}
          onFilterChange={(key, value) => setParam(key, value)}
          onClear={clearFilters}
          activeCount={activeFilterCount}
        />
      )}

      {/* Bulk Actions
      {selected.size > 0 && (
        <BulkActionsBar
          selectedCount={selected.size}
          onClearSelection={() => setSelected(new Set())}
        />
      )} */}

      {/* Stats Cards */}
      <StatsCards tutors={tutors} />

      {/* Main Content */}
      {filteredTutors.length === 0 ? (
        <EmptyState
          hasFilters={activeFilterCount > 0 || !!search}
          onClear={clearFilters}
        />
      ) : view === "cards" ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredTutors.length} نتيجة
            </p>
            {/* Add SortDropdown if desired, similar to students page */}
            <AddTutorDialog
              currencies={currencies}
              specialities={specialities}
              academyId={academyId}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTutors.map((tutor) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                isSelected={selected.has(String(tutor.id))}
                onSelect={() => toggleSelect(String(tutor.id))}
                selectionMode={selected.size > 0}
              />
            ))}
          </div>
        </>
      ) : (
        <TutorTable
          tutors={filteredTutors}
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
}
