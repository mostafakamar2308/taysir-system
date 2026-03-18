"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PerformanceMetrics } from "@/types/tutor";
import { AlertCircle, TrendingUp, FileText, Calendar } from "lucide-react";

export default function ScoreCard({
  performanceMetrics,
}: {
  performanceMetrics: PerformanceMetrics;
}) {
  const metrics = [
    {
      label: "نسبة الحضور",
      value: performanceMetrics.attendanceRate.toFixed(1),
      icon: Calendar,
      weight: "40%",
    },
    {
      label: "الاحتفاظ بالطلاب",
      value: performanceMetrics.retentionRate.toFixed(1),
      icon: TrendingUp,
      weight: "30%",
    },
    {
      label: "الالتزام بالتقارير",
      value: performanceMetrics.reportAdherence.toFixed(1),
      icon: FileText,
      weight: "20%",
    },
    {
      label: "جودة التقارير",
      value: performanceMetrics.reportQuality.toFixed(1),
      icon: AlertCircle,
      weight: "10%",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>بطاقة أداء المعلم</span>
          <span
            className={`text-2xl font-bold ${performanceMetrics.scoreColor}`}
          >
            {performanceMetrics.weightedScore.toFixed(1)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{m.label}</span>
                </div>
                <span className="font-medium">
                  {m.value}%{" "}
                  <span className="text-xs text-muted-foreground">
                    ({m.weight})
                  </span>
                </span>
              </div>
              <Progress value={parseFloat(m.value)} className="h-2" />
            </div>
          ))}
        </div>

        <div
          className={`p-3 rounded-lg mt-2 text-sm ${performanceMetrics.scoreColor.replace("text-", "bg-").replace("600", "100")} border`}
        >
          <p className={`font-medium ${performanceMetrics.scoreColor}`}>
            {performanceMetrics.scoreHint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
