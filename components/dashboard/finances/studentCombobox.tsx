"use client";

import { cn } from "@/lib/utils";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

export function StudentCombobox({
  students,
  value,
  onChange,
  placeholder = "كل الطلاب",
  className,
}: {
  students: { id: number; name: string | null }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const options: ComboboxOption[] = students.map((s) => ({
    value: s.id.toString(),
    label: s.name ?? "",
  }));

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      emptyOption={{ value: "all", label: placeholder }}
      searchPlaceholder="ابحث باسم الطالب..."
      noResultsLabel="لا توجد نتائج"
      className={cn("w-56", className)}
    />
  );
}