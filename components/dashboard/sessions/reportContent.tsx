"use client";

export interface ReportContentData {
  rating?: number | null;
  outcomes?: string | null;
  outcome?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  nextGoals?: string | null;
  comments?: string | null;
}

export function ReportContent({ report }: { report: ReportContentData }) {
  const outcome = report.outcomes ?? report.outcome ?? null;

  const fields: { label: string; value: string | null }[] = [
    { label: "النتائج", value: outcome },
    { label: "نقاط القوة", value: report.strengths ?? null },
    { label: "نقاط الضعف", value: report.weaknesses ?? null },
    { label: "الأهداف القادمة", value: report.nextGoals ?? null },
    { label: "تعليقات المعلم", value: report.comments ?? null },
  ];

  const hasContent = fields.some((f) => f.value);

  if (!hasContent) {
    return (
      <p className="text-sm text-muted-foreground">
        لا توجد تفاصيل إضافية في هذا التقرير
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map(
        (f) =>
          f.value && (
            <div key={f.label}>
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {f.value}
              </p>
            </div>
          ),
      )}
    </div>
  );
}
