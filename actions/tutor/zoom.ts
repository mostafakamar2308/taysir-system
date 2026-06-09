"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function startZoomOAuth() {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("Not authenticated");
  const payload = verifyToken(token);
  if (!payload?.academyId) throw new Error("Unauthorized");

  // // Generate a cryptographically random state
  // const state = randomBytes(32).toString("hex");

  // // Store state in a short-lived, httpOnly cookie
  // const cookieStore = await cookies();
  // cookieStore.set("zoom_oauth_state", state, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "lax",
  //   maxAge: 600, // 10 minutes
  //   path: "/",
  // });

  // Use the exact granular scopes from your Zoom app
  const scope = [
    "user:read:user",
    "meeting:write:meeting",
    "meeting:update:meeting",
    "meeting:delete:meeting",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOOM_CLIENT_ID!,
    redirect_uri: process.env.ZOOM_REDIRECT_URI!,
    scope,
    // state,
  });

  const url = `https://zoom.us/oauth/authorize?${params.toString()}`;
  redirect(url);
}

export async function unlinkZoom() {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) throw new Error("غير مصرح");

  // Clear all Zoom-related fields
  await db.tutor.update({
    where: { id: payload.tutorId },
    data: {
      zoomAuthenticated: false,
      zoomAccessToken: null,
      zoomRefreshToken: null,
      zoomTokenExpiry: null,
      zoomUserId: null,
      zoomUrl: null,
    },
  });

  revalidatePath("/ar/dashboard/tutor/zoom");
}
