"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Award,
  Star,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { SessionRecord } from "@/types/studentProfile";
import dayjs from "@/lib/dayjs";
import { formatDate } from "@/lib/dates";
import { RatingChart } from "@/components/dashboard/student/ratingChart";
import { ReportContent } from "@/components/dashboard/sessions/reportContent";

interface Props {
  sessions: SessionRecord[];
}

export default function ReportsTab({ sessions }: Props) {
  const [tutorFilter, setTutorFilter] = useState("all");

  const reports = useMemo(() => {
    return [...sessions]
      .filter((s) => s.report)
      .sort((a, b) => dayjs(b.startTime).diff(dayjs(a.startTime)));
  }, [sessions]);

  const tutorOptions = useMemo(() => {
    return Array.from(new Set(reports.map((s) => s.tutorName))).sort();
  }, [reports]);

  const filtered = useMemo(() => {
    if (tutorFilter === "all") return reports;
    return reports.filter((s) => s.tutorName === tutorFilter);
  }, [reports, tutorFilter]);

  const analytics = useMemo(() => {
    const ratings = filtered
      .map((s) => s.report!.rating)
      .filter((r): r is number => r != null);
    const avg =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
    const latest = ratings[0] ?? null;
    const best = ratings.length > 0 ? Math.max(...ratings) : null;
    const recent = ratings.slice(0, 3);
    const previous = ratings.slice(3, 6);
    const avgRecent =
      recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const avgPrevious =
      previous.length > 0
        ? previous.reduce((a, b) => a + b, 0) / previous.length
        : 0;
    const distribution = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: ratings.filter((v) => v === r).length,
    }));
    return {
      count: filtered.length,
      ratedCount: ratings.length,
      avg,
      latest,
      best,
      trend: avgRecent - avgPrevious,
      distribution,
      chartData: filtered
        .filter((s) => s.report!.rating != null)
        .map((s) => ({
          sessionDate: s.startTime,
          rating: s.report!.rating!,
        })),
    };
  }, [filtered]);

  const perTutor = useMemo(() => {
    const map = new Map<string, { count: number; sum: number }>();
    for (const s of reports) {
      const entry = map.get(s.tutorName) ?? { count: 0, sum: 0 };
      entry.count += 1;
      if (s.report!.rating != null) entry.sum += s.report!.rating!;
      map.set(s.tutorName, entry);
    }
    return Array.from(map.entries()).map(([name, e]) => ({
      name,
      count: e.count,
      avg: e.count > 0 ? e.sum / e.count : 0,
    }));
  }, [reports]);

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          لا توجد تقارير لهذا الطالب بعد
        </CardContent>
      </Card>
    );
  }

  const maxDist = Math.max(1, ...analytics.distribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Analytics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardList}
          label="عدد التقارير"
          value={String(analytics.count)}
        />
        <StatCard
          icon={Star}
          label="متوسط التقييم"
          value={
            analytics.ratedCount > 0
              ? `${analytics.avg.toFixed(1)} / 5`
              : "—"
          }
        />
        <StatCard
          icon={Award}
          label="أعلى تقييم"
          value={analytics.best != null ? `${analytics.best} / 5` : "—"}
        />
        <StatCard
          icon={analytics.trend >= 0 ? TrendingUp : TrendingDown}
          label="اتجاه آخر 3 تقييمات"
          value={
            analytics.ratedCount > 0
              ? analytics.trend >= 0
                ? "تحسن"
                : "تراجع"
              : "—"
          }
          valueClass={
            analytics.trend > 0
              ? "text-green-600"
              : analytics.trend < 0
                ? "text-red-600"
                : ""
          }
        />
      </div>

      {/* Rating trend + distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تطور التقييمات</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.chartData.length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                لا توجد بيانات كافية لعرض الرسم البياني
              </p>
            ) : (
              <RatingChart ratings={analytics.chartData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع التقييمات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.ratedCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد تقييمات بعد
              </p>
            ) : (
              [...analytics.distribution].reverse().map((d) => (
                <div key={d.rating} className="flex items-center gap-3">
                  <span className="text-sm w-8 shrink-0">{d.rating} ★</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(d.count / maxDist) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-6 text-left">
                    {d.count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per tutor summary */}
      {perTutor.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملخص حسب المعلم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {perTutor.map((t) => (
                <div
                  key={t.name}
                  className="rounded-md border p-3 flex items-center justify-between"
                >
                  <span className="font-medium text-sm">{t.name}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {t.count} تقرير
                    </span>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {t.avg.toFixed(1)} / 5
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg">التقارير</CardTitle>
          {tutorOptions.length > 1 && (
            <Combobox
              options={tutorOptions.map((t) => ({ value: t, label: t }))}
              value={tutorFilter}
              onValueChange={setTutorFilter}
              placeholder="كل المعلمين"
              emptyOption={{ value: "all", label: "كل المعلمين" }}
              className="h-9 w-[180px]"
            />
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              لا توجد تقارير مطابقة
            </p>
          ) : (
            filtered.map((s) => <ReportCard key={s.id} session={s} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${valueClass ?? ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportCard({ session }: { session: SessionRecord }) {
  const [expanded, setExpanded] = useState(false);
  const report = session.report!;

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 p-3 text-right hover:bg-muted/40 transition"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium text-sm">
            {formatDate(session.startTime)}
          </span>
          <span className="text-xs text-muted-foreground">
            • {session.groupName}
          </span>
          <span className="text-xs text-muted-foreground">
            • {session.tutorName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {report.rating != null && (
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {report.rating} / 5
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t">
          <ReportContent report={report} />
        </div>
      )}
    </div>
  );
}
