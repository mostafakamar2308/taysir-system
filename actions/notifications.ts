"use server";

import { user } from "@/lib/auth";
import db from "@/lib/prisma";

export async function subscribeToPush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const currentUser = await user();
  if (!currentUser) throw new Error("Unauthorized");

  const { endpoint, keys } = subscription;
  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: currentUser.id },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId: currentUser.id,
    },
  });
  return { success: true };
}

export async function unsubscribeFromPush(endpoint: string) {
  const currentUser = await user();
  if (!currentUser) throw new Error("Unauthorized");

  await db.pushSubscription.deleteMany({
    where: { endpoint, userId: currentUser.id },
  });
  return { success: true };
}
