import dotenv from "dotenv";
dotenv.config();
import { Queue } from "bullmq";
import { connection } from "@/lib/redis";

export interface WhatsAppJobData {
  academyId: number;
  instanceName: string;
  recipientJid: string;
  message: string;
  isGroup?: boolean;
  options?: {
    delay?: number;
    linkPreview?: boolean;
  };
  messageLogId?: string; // optional tracking
}

export const whatsappQueue = new Queue<WhatsAppJobData>("whatsapp-messages", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
