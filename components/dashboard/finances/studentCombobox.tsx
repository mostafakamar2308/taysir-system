"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const selected = students.find((s) => s.id.toString() === value);

  const clear = () => {
    onChange("all");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-56 justify-between font-normal", className)}
        >
          {selected ? selected.name : placeholder}
          {value !== "all" ? (
            <X
              className="h-4 w-4 opacity-50 ml-1"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
            />
          ) : (
            <ChevronsUpDown className="h-4 w-4 opacity-50 ml-1" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="ابحث باسم الطالب..." />
          <CommandList>
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={clear}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "all" ? "opacity-100" : "opacity-0",
                  )}
                />
                {placeholder}
              </CommandItem>
              {students.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.id.toString()}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === s.id.toString() ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {s.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}