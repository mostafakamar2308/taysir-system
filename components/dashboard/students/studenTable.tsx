"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { SortDir, SortField } from "@/types/lib";
import { DashboardStudent } from "@/types/student";
import { QuickActionsMenu } from "./quickActionsMenu";

interface StudentTableProps {
  students: DashboardStudent[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}

const SortableHead = ({
  field,
  label,
  sortDir,
  sortField,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}) => (
  <TableHead className="text-right">
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDir === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-primary" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 text-primary" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  </TableHead>
);

export function StudentTable({
  students,
  selected,
  onSelect,
  onSelectAll,
  sortField,
  sortDir,
  onSort,
}: StudentTableProps) {
  return (
    <div className="rounded-md border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={
                  selected.size === students.length && students.length > 0
                }
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <SortableHead
              onSort={onSort}
              sortDir={sortDir}
              sortField={sortField}
              field="name"
              label="الاسم"
            />
            <SortableHead
              onSort={onSort}
              sortDir={sortDir}
              sortField={sortField}
              field="age"
              label="العمر"
            />
            <TableHead className="text-right">الدولة</TableHead>
            <SortableHead
              onSort={onSort}
              sortDir={sortDir}
              sortField={sortField}
              field="status"
              label="الحالة"
            />
            {/* <TableHead className="text-right">البرنامج</TableHead> */}
            <TableHead className="text-right">الخطة</TableHead>
            <TableHead className="text-right">المعلم</TableHead>
            <SortableHead
              onSort={onSort}
              sortDir={sortDir}
              sortField={sortField}
              field="renewalDate"
              label="التجديد"
            />
            <TableHead className="text-right w-10">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {students.map((s) => (
            <TableRow
              key={s.id}
              className={selected.has(String(s.id)) ? "bg-primary/5" : ""}
            >
              <TableCell className="flex items-center justify-center">
                <Checkbox
                  checked={selected.has(String(s.id))}
                  onCheckedChange={() => onSelect(String(s.id))}
                />
              </TableCell>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.age}</TableCell>
              <TableCell>{s.country}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium`}
                >
                  {s.status}
                </span>
              </TableCell>
              {/* <TableCell>{s.currentProgram}</TableCell> */}
              <TableCell>{s.plan}</TableCell>
              <TableCell>{s.tutorName}</TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {s.renewalDate?.toLocaleDateString() || "-"}
              </TableCell>
              <TableCell>
                <QuickActionsMenu student={s} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
