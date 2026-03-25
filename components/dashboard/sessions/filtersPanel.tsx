import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sessionStatusLabels } from "@/const/sessions";

interface FiltersPanelProps {
  filterTutor: string;
  filterStudent: string;
  filterStatus: string;
  tutors: { id: number; name: string | null }[];
  students: { id: number; name: string }[];
  onTutorChange: (val: string) => void;
  onStudentChange: (val: string) => void;
  onStatusChange: (val: string) => void;
}

export function FiltersPanel({
  filterTutor,
  filterStudent,
  filterStatus,
  tutors,
  students,
  onTutorChange,
  onStudentChange,
  onStatusChange,
}: FiltersPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border bg-card p-4">
      <Select value={filterTutor} onValueChange={onTutorChange}>
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
      <Select value={filterStudent} onValueChange={onStudentChange}>
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
      <Select value={filterStatus} onValueChange={onStatusChange}>
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
  );
}
