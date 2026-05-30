// components/dashboard/student/RatingChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RatingChartProps {
  ratings: { sessionDate: string; rating: number }[];
}

export function RatingChart({ ratings }: RatingChartProps) {
  // ترتيب تصاعدي حسب التاريخ
  const sorted = [...ratings].sort(
    (a, b) =>
      new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime(),
  );

  if (sorted.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        لا توجد بيانات كافية لعرض الرسم البياني
      </div>
    );
  }

  const chartData = sorted.map((item) => ({
    date: new Date(item.sessionDate).toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
    }),
    rating: item.rating,
  }));

  return (
    <div className="w-full bg-card rounded-lg border p-4">
      <h4 className="text-sm font-medium mb-2 text-center">تطور التقييمات</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            stroke="#9ca3af"
          />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            stroke="#9ca3af"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#111827" }}
          />
          <Line
            type="linear"
            dataKey="rating"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3b82f6" }}
            activeDot={{ r: 6, fill: "#2563eb" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
