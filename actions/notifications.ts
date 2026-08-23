"use server";

import { user } from "@/lib/auth";
import db from "@/lib/prisma";
import { withResult, fail } from "@/lib/action-result";

export const subscribeToPush = withResult(
  async (subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) => {
    const currentUser = await user();
    if (!currentUser) return fail("غير مصرح");

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
  },
);

export const unsubscribeFromPush = withResult(async (endpoint: string) => {
  const currentUser = await user();
  if (!currentUser) return fail("غير مصرح");

  await db.pushSubscription.deleteMany({
    where: { endpoint, userId: currentUser.id },
  });
  return { success: true };
});
