import db from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";

const ACADEMY_NAMES = ["Al-Noor Academy", "Iqra Institute", "Tajweed Center"];
const SPECIALITIES = [
  "Tajweed",
  "Memorization",
  "Qira’at",
  "Tafseer",
  "Arabic Language",
];

async function main() {
  console.log("🌱 Seeding started...");

  const currencies = await Promise.all([
    db.currency.create({
      data: { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
    }),
    db.currency.create({
      data: { code: "USD", name: "دولار أمريكي", symbol: "$" },
    }),
    db.currency.create({
      data: { code: "EGP", name: "جنيه مصري", symbol: "ج.م" },
    }),
  ]);
  const [sar] = currencies;
  console.log("✅ Created currencies");

  await Promise.all(
    SPECIALITIES.map((title) => db.speciality.create({ data: { title } })),
  );
  console.log("✅ Created specialities");

  // Create super admin
  const superAdminUser = await db.user.create({
    data: {
      email: "superadmin@example.com",
      password: await bcrypt.hash("password123", 10),
      name: "Super Admin",
      role: Role.SuperAdmin,
      phone: "+966500000000",
    },
  });
  await db.superAdmin.create({ data: { userId: superAdminUser.id } });
  console.log("✅ Created super admin");

  // Store academy data for later use
  const academyIds: number[] = [];
  const academyTutors: Record<number, number[]> = {};
  const academyStudents: Record<number, number[]> = {};
  const academyAdmins: Record<number, number> = {}; // store admin user id per academy

  // For each academy
  for (let i = 0; i < ACADEMY_NAMES.length; i++) {
    const academyName = ACADEMY_NAMES[i];
    console.log(`\n📚 Creating ${academyName}...`);

    // Create academy with default currency (SAR for all)
    const academy = await db.academy.create({
      data: {
        name: academyName,
        maxTutors: 20,
        maxStudents: 200,
        primaryColor: "#000",
        defaultCurrencyId: sar.id,
      },
    });
    academyIds.push(academy.id);
    academyTutors[academy.id] = [];
    academyStudents[academy.id] = [];

    // Create 3 plans for this academy
    const plans = [];
    for (let p = 1; p <= 3; p++) {
      const plan = await db.plan.create({
        data: {
          title: `Plan ${p}`,
          sessionsPerWeek: p * 2,
          price: p * 150,
          billingPeriod: 30, // days
          currencyId: sar.id,
          academyId: academy.id,
        },
      });
      plans.push(plan);
    }
    console.log(`  ✅ Created 3 plans`);

    // Create admin user
    const adminUser = await db.user.create({
      data: {
        email: `admin${i + 1}@example.com`,
        password: await bcrypt.hash("password123", 10),
        name: `Admin ${i + 1}`,
        role: Role.Admin,
        phone: `+96650123456${i}`,
      },
    });
    await db.admin.create({
      data: { userId: adminUser.id, academyId: academy.id },
    });
    academyAdmins[academy.id] = adminUser.id;
    console.log(`  ✅ Created admin`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
