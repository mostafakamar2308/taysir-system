import webpush from "web-push";
import db from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushNotification(
  userId: number,
  payload: { title: string; body: string; icon?: string; url?: string },
) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  const notifications = subscriptions.map((sub) => {
    return webpush
      .sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      )
      .catch((err) => console.error("Push error:", err));
  });

  await Promise.all(notifications);
}
