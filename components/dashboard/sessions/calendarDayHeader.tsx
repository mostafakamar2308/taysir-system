import { utcToLocalDate } from "@/lib/dates";

const dayNamesShort = [
  "سبت",
  "أحد",
  "اثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
];

type CalendarDayHeaderProps = {
  weekDates: Date[];
  today: Date;
};

export function CalendarDayHeader({
  weekDates,
  today,
}: CalendarDayHeaderProps) {
  return (
    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
      <div className="p-2" />
      {weekDates.map((date, i) => {
        const isToday = utcToLocalDate(date) === utcToLocalDate(today);
        return (
          <div
            key={i}
            className={`p-3 text-center border-r border-border ${isToday ? "bg-primary/5" : ""}`}
          >
            <p className="text-xs text-muted-foreground">{dayNamesShort[i]}</p>
            <p
              className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}
            >
              {date.getDate()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
