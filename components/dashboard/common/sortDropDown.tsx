"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

type SortField =
  | "name"
  | "age"
  | "status"
  | "renewalDate"
  | "startDate"
  | "createdAt";
type SortDir = "asc" | "desc";

const sortLabels: Record<SortField, string> = {
  name: "الاسم",
  age: "العمر",
  status: "الحالة",
  renewalDate: "تاريخ التجديد",
  startDate: "تاريخ البدء",
  createdAt: "تاريخ الإنشاء",
};

interface SortDropdownProps {
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}

export function SortDropdown({
  sortField,
  sortDir,
  onSort,
}: SortDropdownProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <ArrowUpDown className="h-3.5 w-3.5" />
          ترتيب: {sortLabels[sortField]}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(sortLabels) as SortField[]).map((field) => (
          <DropdownMenuItem
            key={field}
            onClick={() => onSort(field)}
            className="gap-2 text-sm"
          >
            <SortIcon field={field} />
            {sortLabels[field]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
