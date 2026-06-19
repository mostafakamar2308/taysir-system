"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeft } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { getWeekDates } from "@/lib/dates";

interface SessionsFiltersProps {
  students: { id: number; name: string }[];
  currentWeekStart: string;
  studentId?: string;
  status?: string;
}

export default function SessionsFilters({
  students,
  currentWeekStart,
  studentId,
  status,
}: SessionsFiltersProps) {
  const t = useTranslations("TutorSessions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const navigateWeek = (dir: number) => {
    const newWeek = dayjs(currentWeekStart)
      .add(dir * 7, "day")
      .format("YYYY-MM-DD");
    updateParams("week", newWeek);
  };

  const goToday = () => {
    updateParams("week", dayjs().startOf("week").format("YYYY-MM-DD"));
  };

  const weekDates = getWeekDates(dayjs(currentWeekStart).toDate());

  return (
    <div className="flex flex-wrap justify-between gap-3 items-center mb-4">
      <div className="flex grow justify-center items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday}>
          {t("today")}
        </Button>
        <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold min-w-40 text-center">
          {dayjs(weekDates[0]).format("D MMMM")} –{" "}
          {dayjs(weekDates[6]).format("D MMMM YYYY")}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Select
          value={studentId || "all"}
          onValueChange={(val) =>
            updateParams("studentId", val === "all" ? null : val)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("allStudents")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStudents")}</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status || "all"}
          onValueChange={(val) =>
            updateParams("status", val === "all" ? null : val)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t("statusPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("statusAll")}</SelectItem>
            <SelectItem value="0">{t("statusScheduled")}</SelectItem>
            <SelectItem value="1">{t("statusCompleted")}</SelectItem>
            <SelectItem value="2">{t("statusCancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
