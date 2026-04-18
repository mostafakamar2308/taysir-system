import dotenv from "dotenv";
dotenv.config();
import { Worker, Job } from "bullmq";
import { connection } from "@/lib/redis";
import { sendTextMessage } from "@/lib/evolution-api";
import { decrypt } from "@/lib/encryption";
import { WhatsAppJobData } from "@/lib/queue/whatsappQueue";

import { PrismaClient } from "@/generated/prisma/client";
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

const worker = new Worker<WhatsAppJobData>(
  "whatsapp-messages",
  async (job: Job<WhatsAppJobData>) => {
    try {
      const {
        academyId,
        instanceName,
        recipientJid,
        message,
        options,
        messageLogId,
      } = job.data;

      const academy = await db.academy.findUnique({
        where: { id: academyId },
        select: {
          whatsappInstanceToken: true,
          whatsappConnectionStatus: true,
        },
      });

      if (!academy?.whatsappInstanceToken) {
        throw new Error(`Academy ${academyId} has no instance token`);
      }

      if (academy.whatsappConnectionStatus !== "connected") {
        throw new Error(`Academy ${academyId} WhatsApp is not connected`);
      }

      let token: string;
      try {
        token = decrypt(academy.whatsappInstanceToken);
      } catch (err) {
        console.error(`❌ Failed to decrypt token:`, err);
        throw err;
      }

      try {
        const result = await sendTextMessage(
          instanceName,
          token,
          recipientJid,
          message,
          options,
        );
        console.log(
          `✅ Message sent! Evolution response:`,
          JSON.stringify(result, null, 2),
        );

        if (messageLogId) {
          await db.whatsAppMessage.update({
            where: { id: messageLogId },
            data: {
              messageId: result.key?.id,
              status: "sent",
              sentAt: new Date(),
            },
          });
          console.log(`  - Database updated for logId ${messageLogId}`);
        }

        return result;
      } catch (error) {
        if (messageLogId && error instanceof Error) {
          await db.whatsAppMessage.update({
            where: { id: messageLogId },
            data: {
              status: "failed",
              errorMessage: error.message,
            },
          });
        }
        throw error;
      }
    } catch (error) {
      console.log({ error });
    }
  },
  { connection, concurrency: 5 },
);

process.on("SIGTERM", async () => {
  console.log("Worker shutting down...");
  await worker.close();
});

console.log("WhatsApp worker started");
