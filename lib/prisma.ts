import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalForPrisma = global as unknown as {
  db: PrismaClient;
};
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const db =
  globalForPrisma.db ||
  new PrismaClient({
    adapter,
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;
export default db;
