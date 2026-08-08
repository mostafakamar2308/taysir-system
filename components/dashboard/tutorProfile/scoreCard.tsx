"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, FileText, AlertCircle, ClipboardList } from "lucide-react";

interface NewPerformanceMetrics {
  attendanceRate: number;
  reportAdherence: number;
  reportQuality: number;
  homeworkGradingCount: number;
  weightedScore: number;
  scoreHint: string;
  scoreColor: string;
}

interface Props {
  performanceMetrics: NewPerformanceMetrics;
}

export default function ScoreCard({ performanceMetrics }: Props) {
  const metrics = [
    {
      label: "نسبة الحضور",
      value: performanceMetrics.attendanceRate.toFixed(1),
      icon: Calendar,
      weight: "35%",
    },
    {
      label: "الالتزام بالتقارير",
      value: performanceMetrics.reportAdherence.toFixed(1),
      icon: FileText,
      weight: "25%",
    },
    {
      label: "جودة التقارير",
      value: performanceMetrics.reportQuality.toFixed(1),
      icon: AlertCircle,
      weight: "25%",
    },
    {
      label: "الواجبات المصححة",
      value: performanceMetrics.homeworkGradingCount.toString(),
      icon: ClipboardList,
      weight: "15%",
      isCount: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>بطاقة أداء المعلم لهذا الشهر</span>
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
                  {m.value}
                  {!m.isCount && "%"}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({m.weight})
                  </span>
                </span>
              </div>
              {!m.isCount && (
                <Progress value={parseFloat(m.value)} className="h-2" />
              )}
              {m.isCount && (
                <Progress
                  value={0}
                  className="h-2"
                /> /* no progress for count, just spacer */
              )}
            </div>
          ))}
        </div>

        <div
          className={`p-3 rounded-lg mt-2 text-sm ${performanceMetrics.scoreColor
            .replace("text-", "bg-")
            .replace("600", "100")} border`}
        >
          <p className={`font-medium ${performanceMetrics.scoreColor}`}>
            {performanceMetrics.scoreHint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
