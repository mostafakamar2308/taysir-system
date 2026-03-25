interface WeekStatsProps {
  stats: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  loading: boolean;
}

export function WeekStats({ stats, loading }: WeekStatsProps) {
  const items = [
    { label: "إجمالي الحصص", value: stats.total, color: "text-foreground" },
    { label: "مجدولة", value: stats.scheduled, color: "text-blue-600" },
    { label: "مكتملة", value: stats.completed, color: "text-primary" },
    { label: "ملغاة", value: stats.cancelled, color: "text-destructive" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className={`text-2xl font-bold ${stat.color}`}>
            {loading ? "–" : stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
