import type { DashboardStudentGroup } from "@/types/student";

export function groupCountDisplay(groups: DashboardStudentGroup[]): string {
  const regularCount = groups.filter((g) => !g.isPrivate).length;
  const privateGroups = groups.filter((g) => g.isPrivate);

  const parts: string[] = [];
  if (regularCount > 0) {
    parts.push(
      `${regularCount} ${regularCount === 1 ? "مجموعة" : "مجموعات"}`,
    );
  }
  if (privateGroups.length > 0) {
    parts.push(
      privateGroups.length === 1
        ? `معلم خاص: ${privateGroups[0].tutorName}`
        : "معلم خاص",
    );
  }
  return parts.join(" + ");
}
