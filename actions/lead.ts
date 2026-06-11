"use server";

import { LeadData, leadSchema } from "@/lib/schemas/lead";
import db from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue/whatsappQueue";
import { constructWhatsAppMessage } from "@/lib/whatsapp-templates";

const SYSTEM_ACADEMY_ID = parseInt(process.env.SYSTEM_ACADEMY_ID || "1", 10);

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function determineTier(teacherCount: string): "A" | "B" | "C" {
  switch (teacherCount) {
    case "16-30":
    case "30+":
      return "A";
    case "6-15":
      return "B";
    case "1-5":
    default:
      return "C";
  }
}

export async function registerLead(data: unknown) {
  const result = leadSchema.safeParse(data);
  if (!result.success) {
    return {
      error: "Validation failed",
      issues: result.error.flatten().fieldErrors,
    };
  }

  const leadData = result.data;

  const tier = determineTier(leadData.teacherCount);
  const qualificationStatus = tier === "C" ? "rejected" : "qualified";

  try {
    console.log({ leadData });

    // Save lead to DB
    const lead = await db.lead.create({
      data: {
        fullName: leadData.fullName,
        phone: leadData.phoneNumber,
        academyName: leadData.academyName,
        countryCode: leadData.countryCode,
        studentCategory: leadData.studentCategory,
        teacherCount: leadData.teacherCount,
        currentMethod: leadData.currentMethod,
        biggestChallenge: leadData.biggestChallenge,
        urgency: leadData.urgency,
        qualificationTier: tier,
        qualificationStatus,
      },
    });

    // Prepare WhatsApp message
    const messageText = constructWhatsAppMessage(
      lead.fullName,
      lead.biggestChallenge!,
      tier,
    );

    const academy = await db.academy.findUnique({
      where: { id: SYSTEM_ACADEMY_ID },
    });

    const recipientJid = `${leadData.phoneNumber.replace(/\D/g, "")}@s.whatsapp.net`;

    const whatsappMessage = await db.whatsAppMessage.create({
      data: {
        academyId: SYSTEM_ACADEMY_ID,
        leadId: lead.id,
        remoteJid: recipientJid,
        type: "text",
        content: messageText,
        status: "pending",
      },
    });

    await whatsappQueue.add("whatsapp-messages", {
      academyId: SYSTEM_ACADEMY_ID,
      instanceName: academy?.whatsappInstanceName || "system",
      messageLogId: whatsappMessage.id,
      recipientJid,
      message: messageText,
    });

    const text = await sendAdminEmail(leadData);
    // Send Whatsapp Reminder to ADMIN
    await whatsappQueue.add("whatsapp-messages", {
      academyId: SYSTEM_ACADEMY_ID,
      instanceName: academy?.whatsappInstanceName || "system",
      recipientJid: `${process.env.ADMIN_PHONE}@s.whatsapp.net`,
      message: text,
    });

    return { success: true };
  } catch (error) {
    console.error("Lead registration error:", error);
    return { error: "حدث خطأ أثناء التسجيل، حاول مرة أخرى" };
  }
}

const sendAdminEmail = async (leadData: LeadData) => {
  const adminEmail = process.env.ADMIN_EMAIL || "mostafakamar.dev@gmail.com";
  const subject = `🔔 جديد في قائمة الانتظار: ${leadData.fullName}`;
  const text = `
معلومات المسجل:
- الاسم: ${leadData.fullName}
- الهاتف: ${leadData.phoneNumber}
- اسم الأكاديمية: ${leadData.academyName}
- حجم الأكاديمية: ${leadData.teacherCount || "غير محدد"}
- الطريقة الحالية: ${leadData.currentMethod || "غير محدد"}
- تاريخ التسجيل: ${new Date().toLocaleString("ar-EG")}

تواصل الآن:
واتساب: https://wa.me/${leadData.phoneNumber.replace(/\D/g, "")}
اتصال: tel:${leadData.phoneNumber}
    `;
  const html = `
      <h2>معلومات المسجل</h2>
      <ul>
        <li><strong>الاسم:</strong> ${leadData.fullName}</li>
        <li><strong>الهاتف:</strong> ${leadData.phoneNumber}</li>
        <li><strong>اسم الأكاديمية:</strong> ${leadData.academyName}</li>
        <li><strong>حجم الأكاديمية:</strong> ${leadData.teacherCount || "غير محدد"}</li>
        <li><strong>الطريقة الحالية:</strong> ${leadData.currentMethod || "غير محدد"}</li>
        <li><strong>تاريخ التسجيل:</strong> ${new Date().toLocaleString("ar-EG")}</li>
      </ul>
      <p>
        <a href="https://wa.me/${leadData.phoneNumber.replace(/\D/g, "")}" style="background:#25D366; color:white; padding:8px 16px; text-decoration:none; border-radius:4px;">📱 واتساب</a>
        &nbsp;
        <a href="tel:${leadData.phoneNumber}" style="background:#0077B5; color:white; padding:8px 16px; text-decoration:none; border-radius:4px;">📞 اتصال</a>
      </p>
    `;

  await transporter.sendMail({
    from: `"نظام أكاديميتي" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject,
    text,
    html,
  });
  return text;
};
