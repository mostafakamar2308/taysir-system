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
import { Badge } from "@/components/ui/badge";
import { DashboardTutor } from "@/types/tutor";
import { QuickActionsMenu } from "@/components/dashboard/tutors/quickActionsMenu";
import { SortField, SortDir } from "@/types/lib";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface TutorTableProps {
  tutors: DashboardTutor[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
};

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  inactive: "bg-muted text-muted-foreground",
};

const SortableHead = ({
  field,
  label,
  current,
  dir,
  onSort,
}: {
  field: SortField;
  label: string;
  current: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
}) => (
  <TableHead className="text-right">
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
    >
      {label}
      {current === field ? (
        dir === "asc" ? (
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

export default function TutorTable({
  tutors,
  selected,
  onSelect,
  onSelectAll,
  sortField,
  sortDir,
  onSort,
}: TutorTableProps) {
  return (
    <div className="rounded-md border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selected.size === tutors.length && tutors.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <SortableHead
              field="name"
              label="الاسم"
              current={sortField}
              dir={sortDir}
              onSort={onSort}
            />
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">التخصصات</TableHead>
            <SortableHead
              field="pricePerSession"
              label="سعر الحصة"
              current={sortField}
              dir={sortDir}
              onSort={onSort}
            />
            <TableHead className="text-right">المنطقة الزمنية</TableHead>
            <SortableHead
              field="studentCount"
              label="عدد الطلاب"
              current={sortField}
              dir={sortDir}
              onSort={onSort}
            />
            <SortableHead
              field="createdAt"
              label="تاريخ الانضمام"
              current={sortField}
              dir={sortDir}
              onSort={onSort}
            />
            <TableHead className="text-right w-10">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tutors.map((tutor) => {
            const statusKey = tutor.status ? "active" : "inactive";
            return (
              <TableRow
                key={tutor.id}
                className={selected.has(String(tutor.id)) ? "bg-primary/5" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(String(tutor.id))}
                    onCheckedChange={() => onSelect(String(tutor.id))}
                  />
                </TableCell>
                <TableCell className="font-medium">{tutor.name}</TableCell>
                <TableCell>
                  <Badge className={statusColors[statusKey]}>
                    {statusLabels[statusKey]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {tutor.specialities.join("، ") || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  {tutor.pricePerSession} {tutor.currency}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {tutor.timezone}
                </TableCell>
                <TableCell>{tutor.studentCount}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(tutor.createdAt).toLocaleDateString("ar-EG")}
                </TableCell>
                <TableCell>
                  <QuickActionsMenu tutor={tutor} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
