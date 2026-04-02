"use server";

import { waitlistSchema } from "@/lib/schemas/waitlist";
import db from "@/lib/prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function addToWaitlist(formData: FormData) {
  // Convert FormData to object
  const rawData: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (key === "reviewBonus" || key === "videoBonus" || key === "terms") {
      rawData[key] = value === "true";
    } else {
      rawData[key] = value;
    }
  });

  const result = waitlistSchema.safeParse(rawData);

  if (!result.success) {
    return {
      error: "Validation failed",
      issues: result.error.flatten().fieldErrors,
    };
  }

  const data = result.data;

  try {
    await db.waitlist.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        academyName: data.academyName,
        academySize: data.academySize,
        currentMethod: data.currentMethod,
        reviewBonus: data.reviewBonus ?? false,
        videoBonus: data.videoBonus ?? false,
        terms: data.terms,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || "mostafakamar.dev@gmail.com";
    const subject = `🔔 جديد في قائمة الانتظار: ${data.fullName}`;
    const text = `
معلومات المسجل:
- الاسم: ${data.fullName}
- البريد الإلكتروني: ${data.email}
- الهاتف: ${data.phone}
- اسم الأكاديمية: ${data.academyName}
- حجم الأكاديمية: ${data.academySize || "غير محدد"}
- الطريقة الحالية: ${data.currentMethod || "غير محدد"}
- مراجعة مجانية: ${data.reviewBonus ? "نعم" : "لا"}
- فيديو مجاني: ${data.videoBonus ? "نعم" : "لا"}
- تاريخ التسجيل: ${new Date().toLocaleString("ar-EG")}

تواصل الآن:
واتساب: https://wa.me/${data.phone.replace(/\D/g, "")}
اتصال: tel:${data.phone}
    `;
    const html = `
      <h2>معلومات المسجل</h2>
      <ul>
        <li><strong>الاسم:</strong> ${data.fullName}</li>
        <li><strong>البريد الإلكتروني:</strong> ${data.email}</li>
        <li><strong>الهاتف:</strong> ${data.phone}</li>
        <li><strong>اسم الأكاديمية:</strong> ${data.academyName}</li>
        <li><strong>حجم الأكاديمية:</strong> ${data.academySize || "غير محدد"}</li>
        <li><strong>الطريقة الحالية:</strong> ${data.currentMethod || "غير محدد"}</li>
        <li><strong>مراجعة مجانية:</strong> ${data.reviewBonus ? "نعم" : "لا"}</li>
        <li><strong>فيديو مجاني:</strong> ${data.videoBonus ? "نعم" : "لا"}</li>
        <li><strong>تاريخ التسجيل:</strong> ${new Date().toLocaleString("ar-EG")}</li>
      </ul>
      <p>
        <a href="https://wa.me/${data.phone.replace(/\D/g, "")}" style="background:#25D366; color:white; padding:8px 16px; text-decoration:none; border-radius:4px;">📱 واتساب</a>
        &nbsp;
        <a href="tel:${data.phone}" style="background:#0077B5; color:white; padding:8px 16px; text-decoration:none; border-radius:4px;">📞 اتصال</a>
      </p>
    `;

    await transporter.sendMail({
      from: `"نظام أكاديميتي" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject,
      text,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return { error: "Failed to add to waitlist" };
  }
}
