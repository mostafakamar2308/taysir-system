import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Search,
  Filter,
} from "lucide-react";
import dayjs from "@/lib/dayjs";

interface WeekNavigationProps {
  viewMode: "day" | "week" | "month";
  currentDate: Date;
  onNavigate: (dir: number) => void;
  onToday: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
}

export function WeekNavigation({
  viewMode,
  currentDate,
  onNavigate,
  onToday,
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFilterCount,
}: WeekNavigationProps) {
  const formatTitle = () => {
    if (viewMode === "day") {
      return dayjs(currentDate).format("D MMMM YYYY");
    } else if (viewMode === "week") {
      const start = dayjs(currentDate).startOf("week");
      const end = dayjs(currentDate).endOf("week");
      return `${start.format("D MMMM")} – ${end.format("D MMMM YYYY")}`;
    } else {
      return dayjs(currentDate).format("MMMM YYYY");
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onNavigate(-1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday} className="gap-2">
          <CalendarDays className="h-4 w-4" />
          اليوم
        </Button>
        <Button variant="outline" size="icon" onClick={() => onNavigate(1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground mr-2">
          {formatTitle()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-56">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الموضوع..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9 h-9 text-sm"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={onToggleFilters}
          className="gap-2"
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
      </div>
    </div>
  );
}
