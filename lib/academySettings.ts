import db from "@/lib/prisma";

export type AcademySchedulingSettings = {
  tutorsCanCreateSessions: boolean;
  tutorsCanEditSessionTime: boolean;
};

export async function getAcademySchedulingSettings(
  academyId: number,
): Promise<AcademySchedulingSettings> {
  const settings = await db.academySettings.findUnique({
    where: { academyId },
  });
  return {
    tutorsCanCreateSessions: settings?.tutorsCanCreateSessions ?? true,
    tutorsCanEditSessionTime: settings?.tutorsCanEditSessionTime ?? true,
  };
}