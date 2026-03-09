"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";

interface FilterOptions {
  tutors: string[];
  countries: string[];
  statuses: { value: string; label: string }[];
  plans: { value: string; label: string }[];
}

interface FilterPanelProps {
  filterOptions: FilterOptions;
  currentFilters: {
    status: string;
    tutor: string;
    country: string;
    plan: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
}

export default function FilterPanel({
  filterOptions,
  currentFilters,
  onFilterChange,
  onClear,
  activeCount,
}: FilterPanelProps) {
  return (
    <Card className="border shadow-sm animate-in slide-in-from-top-2 duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            فلاتر متقدمة
          </h3>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs gap-1 text-muted-foreground"
            >
              <X className="h-3 w-3" />
              مسح الكل
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <FilterSelect
            label="الحالة"
            value={currentFilters.status}
            onChange={(v) => onFilterChange("status", v)}
            options={filterOptions.statuses}
          />
          <FilterSelect
            label="المعلم"
            value={currentFilters.tutor}
            onChange={(v) => onFilterChange("tutor", v)}
            options={filterOptions.tutors.map((t) => ({ value: t, label: t }))}
          />
          <FilterSelect
            label="الدولة"
            value={currentFilters.country}
            onChange={(v) => onFilterChange("country", v)}
            options={filterOptions.countries.map((c) => ({
              value: c,
              label: c,
            }))}
          />
          <FilterSelect
            label="الخطة"
            value={currentFilters.plan}
            onChange={(v) => onFilterChange("plan", v)}
            options={filterOptions.plans}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value || "all"}
      onValueChange={(v) => onChange(v === "all" ? "" : v)}
    >
      <SelectTrigger className="text-sm h-9">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">الكل - {label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
