import db from "@/lib/prisma";
import { Role } from "@/types/user";
import bcrypt from "bcrypt";

const ACADEMY_NAMES = ["Al-Noor Academy", "Iqra Institute", "Tajweed Center"];
const SPECIALITIES = [
  "Tajweed",
  "Memorization",
  "Qira’at",
  "Tafseer",
  "Arabic Language",
];
const PLANS = [
  { title: "Basic", sessionsPerWeek: 2 },
  { title: "Standard", sessionsPerWeek: 3 },
  { title: "Premium", sessionsPerWeek: 5 },
];

// Helper
const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

interface RoleData {
  academyId?: number;
  pricePerSession?: number;
  specialities?: number[];
}

async function createUserWithRole(
  email: string,
  name: string,
  role: number,
  roleData: RoleData = {},
) {
  const PASSWORD_HASH = await bcrypt.hash("password123", 10);

  const user = await db.user.create({
    data: {
      email,
      password: PASSWORD_HASH,
      name,
      role,
    },
  });

  switch (role) {
    case Role.SuperAdmin:
      await db.superAdmin.create({ data: { userId: user.id } });
      break;
    case Role.Admin:
      await db.admin.create({
        data: {
          userId: user.id,
          academyId: roleData.academyId!,
        },
      });
      break;
    case Role.Supervisor:
      await db.supervisor.create({
        data: {
          userId: user.id,
          academyId: roleData.academyId!,
        },
      });
      break;
    case Role.Tutor:
      await db.tutor.create({
        data: {
          userId: user.id,
          academyId: roleData.academyId!,
          pricePerSession: roleData.pricePerSession || 20.0,
          active: true,
          specialities: {
            connect: roleData.specialities?.map((id) => ({ id })) || [],
          },
        },
      });
      break;
  }

  return user;
}

async function main() {
  console.log("🌱 Seeding started...");

  // Clean up existing data (order matters)
  await db.$transaction([
    db.student.deleteMany(),
    db.tutor.deleteMany(),
    db.supervisor.deleteMany(),
    db.admin.deleteMany(),
    db.superAdmin.deleteMany(),
    db.user.deleteMany(),
    db.academy.deleteMany(),
    db.speciality.deleteMany(),
    db.plan.deleteMany(),
  ]);

  // Create Plans
  const createdPlans = await Promise.all(
    PLANS.map((plan) =>
      db.plan.create({
        data: plan,
      }),
    ),
  );
  console.log(`✅ Created ${createdPlans.length} plans`);

  // Create Specialities
  const createdSpecialities = await Promise.all(
    SPECIALITIES.map((title) =>
      db.speciality.create({
        data: { title },
      }),
    ),
  );
  console.log(`✅ Created ${createdSpecialities.length} specialities`);

  // Create Super Admin
  await createUserWithRole(
    "superadmin@example.com",
    "Super Admin",
    Role.SuperAdmin,
  );
  console.log("✅ Created Super Admin");

  // Create Academies, Admins, Supervisors, Tutors, and Students
  for (let i = 0; i < ACADEMY_NAMES.length; i++) {
    const academyName = ACADEMY_NAMES[i];

    const academy = await db.academy.create({
      data: { name: academyName },
    });
    console.log(`📚 Created academy: ${academy.name}`);

    // Admin
    await createUserWithRole(
      `admin${i + 1}@example.com`,
      `Admin ${i + 1}`,
      Role.Admin,
      { academyId: academy.id },
    );

    // Supervisors (2)
    for (let s = 1; s <= 2; s++) {
      await createUserWithRole(
        `supervisor${i + 1}_${s}@example.com`,
        `Supervisor ${i + 1}-${s}`,
        Role.Supervisor,
        { academyId: academy.id },
      );
    }
    console.log(`  👥 Created 2 supervisors for ${academy.name}`);

    // Tutors (10)
    const tutorIds: number[] = [];
    for (let t = 1; t <= 10; t++) {
      const tutorUser = await createUserWithRole(
        `tutor${i + 1}_${t}@example.com`,
        `Tutor ${i + 1}-${t}`,
        Role.Tutor,
        {
          academyId: academy.id,
          pricePerSession: 15 + (t % 10) * 2,
          specialities: [
            createdSpecialities[
              Math.floor(Math.random() * createdSpecialities.length)
            ].id,
            createdSpecialities[
              Math.floor(Math.random() * createdSpecialities.length)
            ].id,
          ].filter((v, idx, arr) => arr.indexOf(v) === idx), // unique
        },
      );

      const tutorRecord = await db.tutor.findUnique({
        where: { userId: tutorUser.id },
      });
      tutorIds.push(tutorRecord!.id);
    }
    console.log(`  👨‍🏫 Created 10 tutors for ${academy.name}`);

    // Students (30)
    for (let st = 1; st <= 30; st++) {
      const tutorId = randomElement(tutorIds);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
      const renewalDate = new Date(startDate);
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      await db.student.create({
        data: {
          name: `Student ${i + 1}-${st}`,
          email: `student${i + 1}_${st}@example.com`,
          phone: `+1234567${String(st).padStart(3, "0")}`,
          country: randomElement([
            "Egypt",
            "Saudi Arabia",
            "UAE",
            "Jordan",
            "Morocco",
          ]),
          timezone: randomElement(["GMT+2", "GMT+3", "GMT+4"]),
          status: Math.floor(Math.random() * 3),
          startDate,
          renewalDate,
          tutorId,
          academyId: academy.id,
        },
      });
    }
    console.log(`  🧑‍🎓 Created 30 students for ${academy.name}`);
  }

  console.log("🌱 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
