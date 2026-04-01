import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import AdminDashboardClient from "@/components/dashboard/admin/dashboard/viewer";
import dayjs from "@/lib/dayjs";

export default async function AdminDashboardPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.SuperAdmin) {
    redirect("/login");
  }

  // Basic counts
  const [
    totalAcademies,
    totalUsers,
    totalStudents,
    totalTutors,
    activeSubscriptions,
    totalRevenue,
  ] = await Promise.all([
    db.academy.count(),
    db.user.count(),
    db.student.count(),
    db.tutor.count(),
    db.academy.count({
      where: {
        saasPlanEndDate: { gt: new Date() },
      },
    }),
    db.academy
      .findMany({
        where: {
          saasPlanEndDate: { gt: new Date() },
          saasPlan: { egyptianPrice: { gt: 0 } },
        },
        select: { saasPlan: { select: { egyptianPrice: true } } },
      })
      .then((academies) =>
        academies.reduce((sum, a) => sum + (a.saasPlan?.egyptianPrice || 0), 0),
      ),
  ]);

  // Monthly revenue for last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = dayjs().subtract(i, "month");
    return {
      month: d.format("MMM YYYY"),
      monthKey: d.format("YYYY-MM"),
      start: d.startOf("month").toDate(),
      end: d.endOf("month").toDate(),
    };
  }).reverse();

  const monthlyRevenue = await Promise.all(
    last6Months.map(async ({ month, start, end }) => {
      // Sum revenue from all academies' SaaS plans that were active during that month
      const academies = await db.academy.findMany({
        where: {
          saasPlanEndDate: { gt: start },
          saasPlanStartDate: { lt: end },
          saasPlan: { egyptianPrice: { gt: 0 } },
        },
        select: { saasPlan: { select: { egyptianPrice: true } } },
      });
      const revenue = academies.reduce(
        (sum, a) => sum + (a.saasPlan?.egyptianPrice || 0),
        0,
      );
      return { month, revenue };
    }),
  );

  // Academies near end (within 7 days)
  const nearEndAcademies = await db.academy
    .findMany({
      where: {
        saasPlanEndDate: {
          gte: new Date(),
          lte: dayjs().add(7, "day").toDate(),
        },
      },
      include: {
        admin: { include: { user: true } },
        saasPlan: true,
      },
    })
    .then((academies) =>
      academies.map((a) => ({
        id: a.id,
        name: a.name,
        adminName: a.admin?.user.name || null,
        adminPhone: a.admin?.user.phone || null,
        endDate: a.saasPlanEndDate,
        planName: a.saasPlan?.name || null,
      })),
    );

  // Academies exceeding limits
  const academiesExceeding = await db.academy
    .findMany({
      where: {
        saasPlanId: { not: null },
      },
      include: {
        saasPlan: true,
        admin: {
          include: {
            user: true,
          },
        },
        _count: {
          select: { students: true, tutors: true },
        },
      },
    })
    .then((academies) =>
      academies
        .filter((a) => {
          const overStudents =
            a.saasPlan?.maxStudents &&
            a._count.students > a.saasPlan.maxStudents;
          const overTutors =
            a.saasPlan?.maxTutors && a._count.tutors > a.saasPlan.maxTutors;
          return overStudents || overTutors;
        })
        .map((a) => ({
          id: a.id,
          name: a.name,
          adminName: a.admin?.user.name || null,
          adminPhone: a.admin?.user.phone || null,
          studentCount: a._count.students,
          tutorCount: a._count.tutors,
          maxStudents: a.saasPlan?.maxStudents || null,
          maxTutors: a.saasPlan?.maxTutors || null,
        })),
    );

  // Recent academies (last 5)
  const recentAcademies = await db.academy
    .findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { include: { user: true } },
        saasPlan: true,
      },
    })
    .then((academies) =>
      academies.map((a) => ({
        id: a.id,
        name: a.name,
        adminName: a.admin?.user.name || null,
        createdAt: a.createdAt,
        planName: a.saasPlan?.name || null,
      })),
    );

  return (
    <AdminDashboardClient
      stats={{
        totalAcademies,
        totalUsers,
        totalStudents,
        totalTutors,
        activeSubscriptions,
        totalRevenue,
      }}
      monthlyRevenue={monthlyRevenue}
      nearEndAcademies={nearEndAcademies}
      academiesExceeding={academiesExceeding}
      recentAcademies={recentAcademies}
    />
  );
}
