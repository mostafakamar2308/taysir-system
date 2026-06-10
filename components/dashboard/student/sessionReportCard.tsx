import { useTranslations } from "next-intl";
import { Star, Clock, BookOpen } from "lucide-react";
import dayjs from "@/lib/dayjs";

interface ReportData {
  rating: number | null;
  outcomes: string | null;
  strengths: string | null;
  weaknesses: string | null;
  nextGoals: string | null;
  sessionDate: string; // ISO string
  topic?: string | null;
}

export function SessionReportCard({ report }: { report: ReportData }) {
  const t = useTranslations("StudentDashboard");
  const formattedDate = dayjs
    .utc(report.sessionDate)
    .format("dddd، DD MMMM YYYY");
  const formattedTime = dayjs.utc(report.sessionDate).format("HH:mm");

  return (
    <div
      dir="rtl"
      className="bg-linear-to-br from-card to-muted/30 border rounded-xl p-5 space-y-4 shadow-sm transition-all hover:shadow-md"
    >
      {/* Card header: session details */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-3">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          <span>{formattedDate}</span>
          <span className="font-medium text-foreground">{formattedTime}</span>
        </div>
        {report.topic && (
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{report.topic}</span>
          </div>
        )}
      </div>

      {/* Rating */}
      {report.rating && (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < report.rating!
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
          <span className="mr-2 text-sm font-medium">{report.rating}/5</span>
        </div>
      )}

      {/* Details */}
      <div className="text-sm space-y-1">
        {report.outcomes && (
          <p>
            <span className="font-semibold text-primary">
              {t("report.outcomes")}:
            </span>{" "}
            {report.outcomes}
          </p>
        )}
        {report.strengths && (
          <p>
            <span className="font-semibold text-green-600">
              {t("report.strengths")}:
            </span>{" "}
            {report.strengths}
          </p>
        )}
        {report.weaknesses && (
          <p>
            <span className="font-semibold text-orange-600">
              {t("report.weaknesses")}:
            </span>{" "}
            {report.weaknesses}
          </p>
        )}
        {report.nextGoals && (
          <p>
            <span className="font-semibold text-blue-600">
              {t("report.nextGoals")}:
            </span>{" "}
            {report.nextGoals}
          </p>
        )}
      </div>

      {!report.rating &&
        !report.outcomes &&
        !report.strengths &&
        !report.weaknesses &&
        !report.nextGoals && (
          <p className="text-muted-foreground text-sm">
            {t("report.noDetails")}
          </p>
        )}
    </div>
  );
}
