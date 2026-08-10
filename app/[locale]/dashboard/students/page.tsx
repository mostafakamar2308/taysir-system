import db from "@/lib/prisma";
import StudentsViewer from "@/components/dashboard/students/viewer";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { DashboardStudent } from "@/types/student";
import type { SortDir, SortField } from "@/types/lib";
import type { Prisma } from "@/generated/prisma/client";
import { SubscriptionStatus } from "@/types/subscription";
import { countSessionsUsed } from "@/lib/studentFinances";

const VALID_SORT_FIELDS: SortField[] = ["name", "age", "status"];
const VALID_SORT_DIRS: SortDir[] = ["asc", "desc"];

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    tutor?: string;
    country?: string;
    group?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) redirect("/login");
  const academyId = currentUser.academyId;
  const params = await searchParams;

  const name = params.q?.trim() || undefined;
  const status = params.status ? parseInt(params.status, 10) : undefined;
  const tutorId = params.tutor ? parseInt(params.tutor, 10) : undefined;
  const groupId = params.group ? parseInt(params.group, 10) : undefined;
  const country = params.country || undefined;
  const sortField = (
    VALID_SORT_FIELDS.includes(params.sort as SortField)
      ? params.sort
      : "name"
  ) as SortField;
  const sortDir = (VALID_SORT_DIRS.includes(params.dir as SortDir)
    ? params.dir
    : "asc") as SortDir;

  const where: Prisma.StudentWhereInput = { academyId };
  if (name) {
    where.user = { name: { contains: name, mode: "insensitive" } };
  }
  if (status !== undefined && Number.isFinite(status)) {
    where.status = status;
  }
  const membershipConditions: Prisma.GroupStudentWhereInput[] = [];
  if (tutorId && Number.isFinite(tutorId)) {
    const privateGroups = await db.group.findMany({
      where: { academyId, currentTutorId: tutorId },
      select: {
        id: true,
        _count: { select: { members: { where: { active: true } } } },
      },
    });
    const privateGroupIds = privateGroups
      .filter((g) => g._count.members === 1)
      .map((g) => g.id);
    membershipConditions.push({
      active: true,
      groupId: privateGroupIds.length > 0 ? { in: privateGroupIds } : -1,
    });
  }
  if (groupId && Number.isFinite(groupId)) {
    membershipConditions.push({ active: true, groupId });
  }
  if (membershipConditions.length > 0) {
    where.groupMemberships = { some: { AND: membershipConditions } };
  }
  if (country) {
    where.country = country;
  }

  const orderBy =
    sortField === "name"
      ? { user: { name: sortDir } }
      : { [sortField]: sortDir };

  const students = await db.student.findMany({
    where,
    include: {
      user: {
        select: { name: true, phone: true, email: true, timezone: true },
      },
      groupMemberships: {
        where: { active: true },
        include: {
          group: {
            select: {
              id: true,
              title: true,
              currentTutor: {
                select: { id: true, user: { select: { name: true } } },
              },
              _count: { select: { members: { where: { active: true } } } },
            },
          },
          subscriptions: {
            where: { status: SubscriptionStatus.active },
            select: { id: true, sessionCount: true, startDate: true, endDate: true },
          },
        },
      },
      sessionParticipants: {
        select: {
          session: {
            select: {
              startTime: true,
              groupId: true,
              cancelledBy: true,
              isTrial: true,
            },
          },
        },
      },
    },
    orderBy,
  });

  const transformedStudents: DashboardStudent[] = students.map((student) => {
    const groups = student.groupMemberships.map((m) => ({
      groupId: m.group.id,
      groupTitle: m.group.title,
      tutorId: m.group.currentTutor.id,
      tutorName: m.group.currentTutor.user.name ?? "غير معروف",
      isPrivate: m.group._count.members === 1,
    }));
    let sessionsTotal: number | null = 0;
    let sessionsUsed = 0;
    for (const m of student.groupMemberships) {
      for (const sub of m.subscriptions) {
        if (sub.sessionCount == null) continue;
        sessionsTotal += sub.sessionCount;
        sessionsUsed += countSessionsUsed(
          sub.startDate,
          sub.endDate,
          m.group.id,
          student.sessionParticipants,
        );
      }
    }
    if (sessionsTotal === 0) sessionsTotal = null;
    return {
      id: student.id,
      name: student.user.name || "",
      email: student.user.email || "",
      age: student.age,
      phone: student.user.phone || "",
      country: student.country || "",
      timezone: student.user.timezone,
      status: student.status,
      creditBalance: student.creditBalance,
      sessionsUsed,
      sessionsTotal,
      groups,
    };
  });

  const [tutors, countryRows, groupRows, statusCounts, currencies] =
    await Promise.all([
      db.tutor.findMany({
        include: { user: true },
        where: { active: true, academyId },
      }),
      db.student.findMany({
        where: { academyId, country: { not: null } },
        select: { country: true },
        distinct: ["country"],
      }),
      db.group.findMany({
        where: { academyId },
        include: { _count: { select: { members: { where: { active: true } } } } },
      }),
      db.student.groupBy({
        by: ["status"],
        where: { academyId },
        _count: { _all: true },
      }),
      db.currency.findMany({}),
    ]);

  const tutorOptions = tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
  }));

  const groupOptions = groupRows
    .filter((g) => g._count.members > 1)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((g) => ({
      value: String(g.id),
      label: `${g.title} (${g._count.members})`,
    }));

  const countryOptions = countryRows
    .map((r) => r.country)
    .filter((c): c is string => Boolean(c));

  const countsByStatus = statusCounts.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    },
    {} as Record<number, number>,
  );
  const totalStudents = statusCounts.reduce(
    (sum, row) => sum + row._count._all,
    0,
  );

  return (
    <StudentsViewer
      students={transformedStudents}
      tutors={tutorOptions}
      academyId={academyId}
      currencies={currencies}
      filterOptions={{ countries: countryOptions, groups: groupOptions }}
      statusCounts={countsByStatus}
      totalStudents={totalStudents}
    />
  );
}
