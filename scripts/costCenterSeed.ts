import db from "@/lib/prisma";

async function main() {
  await db.costCenter.deleteMany();
  await Promise.all([
    db.costCenter.create({
      data: { title: "مرتبات المعلمين" },
    }),
    db.costCenter.create({
      data: { title: "مرتبات الموظفين (غير المعلمين)" },
    }),
    db.costCenter.create({
      data: { title: "الإعلانات" },
    }),
    db.costCenter.create({
      data: { title: "تصوير المحتوى" },
    }),
    db.costCenter.create({
      data: { title: "إشتراكات برامج" },
    }),
    db.costCenter.create({
      data: { title: "ضرائب" },
    }),
    db.costCenter.create({
      data: { title: "حوافز" },
    }),
    db.costCenter.create({
      data: { title: "أخرى" },
    }),
  ]);

  console.log(`  ✅ Created cost centers`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
