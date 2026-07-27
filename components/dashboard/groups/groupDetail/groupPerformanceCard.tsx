"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  performances: {
    studentId: number;
    studentName: string;
    averageRating: number | null;
  }[];
}

export default function GroupPerformanceCard({ performances }: Props) {
  const data = performances
    .filter((p) => p.averageRating !== null)
    .map((p) => ({
      name: p.studentName,
      rating: Math.round((p.averageRating ?? 0) * 10) / 10,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">أداء الطلاب (متوسط التقييمات)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">لا توجد تقييمات بعد</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="rating" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
