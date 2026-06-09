// app/api/zoom/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  // const state = searchParams.get("state");

  // // 1. Validate state
  const cookieStore = await cookies();
  // const storedState = cookieStore.get("zoom_oauth_state")?.value;
  // console.log({ state, code, storedState });
  // if (!storedState || storedState !== state) {
  //   cookieStore.delete("zoom_oauth_state");
  //   return NextResponse.redirect(
  //     new URL("/ar/dashboard/tutor/zoom?message=invalid_state", request.url),
  //   );
  // }
  // cookieStore.delete("zoom_oauth_state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/ar/dashboard/tutor/zoom?message=missing_code", request.url),
    );
  }

  // 2. Exchange code for tokens
  const tokenResponse = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.ZOOM_REDIRECT_URI!,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Zoom token exchange failed:", error);
    return NextResponse.redirect(
      new URL("/ar/dashboard/tutor/zoom?message=zoom_auth_failed", request.url),
    );
  }

  const tokenData = await tokenResponse.json();
  const { access_token, refresh_token, expires_in } = tokenData;

  // 3. Fetch Zoom user info
  const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userResponse.ok) {
    return NextResponse.redirect(
      new URL(
        "/ar/dashboard/tutor/zoom?message=zoom_user_fetch_failed",
        request.url,
      ),
    );
  }
  const zoomUser = await userResponse.json();
  const zoomUserId = zoomUser.id;

  // 4. Get current tutor from JWT cookie
  const tokenCookie = cookieStore.get("token")?.value;
  if (!tokenCookie) {
    return NextResponse.redirect(
      new URL(
        "/ar/dashboard/tutor/zoom?message=not_authenticated",
        request.url,
      ),
    );
  }
  const payload = verifyToken(tokenCookie);
  if (!payload?.tutorId) {
    return NextResponse.redirect(
      new URL("/ar/dashboard/tutor/zoom?message=not_tutor", request.url),
    );
  }

  // 5. Store encrypted tokens
  const encryptedAccessToken = encrypt(access_token);
  const encryptedRefreshToken = encrypt(refresh_token);
  const expiryDate = new Date(Date.now() + expires_in * 1000);

  await db.tutor.update({
    where: { id: payload.tutorId },
    data: {
      zoomAuthenticated: true,
      zoomAccessToken: encryptedAccessToken,
      zoomRefreshToken: encryptedRefreshToken,
      zoomTokenExpiry: expiryDate,
      zoomUserId: zoomUserId,
      zoomUrl: `https://zoom.us/user/${zoomUserId}`,
    },
  });

  // 6. Redirect to settings
  return NextResponse.redirect(
    new URL("/ar/dashboard/tutor/zoom", request.url),
  );
}
