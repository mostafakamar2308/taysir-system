"use server";

import { waitlistSchema } from "@/lib/schemas/waitlist";
import db from "@/lib/prisma"; // adjust to your DB client

export async function addToWaitlist(formData: FormData) {
  // Convert FormData to object
  const rawData: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    // Handle checkboxes (they come as 'on' or undefined)
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

    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return { error: "Failed to add to waitlist" };
  }
}
