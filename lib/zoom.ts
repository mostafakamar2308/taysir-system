import db from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/encryption";

const ZOOM_API_BASE = "https://api.zoom.us/v2";

interface ZoomTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Fetch and decrypt tokens for a tutor
async function getStoredTokens(tutorId: number): Promise<ZoomTokens | null> {
  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    select: {
      zoomAccessToken: true,
      zoomRefreshToken: true,
      zoomTokenExpiry: true,
    },
  });

  if (!tutor?.zoomAccessToken || !tutor?.zoomRefreshToken) return null;

  return {
    accessToken: decrypt(tutor.zoomAccessToken),
    refreshToken: decrypt(tutor.zoomRefreshToken),
    expiresAt: tutor.zoomTokenExpiry!,
  };
}

// Update stored tokens after refresh
async function updateStoredTokens(
  tutorId: number,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
) {
  const encryptedAccess = encrypt(accessToken);
  const encryptedRefresh = encrypt(refreshToken);
  const expiry = new Date(Date.now() + expiresIn * 1000);

  await db.tutor.update({
    where: { id: tutorId },
    data: {
      zoomAccessToken: encryptedAccess,
      zoomRefreshToken: encryptedRefresh,
      zoomTokenExpiry: expiry,
    },
  });
}

// Refresh the access token using the refresh token
async function refreshAccessToken(
  tutorId: number,
  refreshToken: string,
): Promise<string> {
  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom token refresh failed: ${error}`);
  }

  const data = await response.json();
  // Update stored tokens (Zoom usually returns a new refresh token)
  await updateStoredTokens(
    tutorId,
    data.access_token,
    data.refresh_token,
    data.expires_in,
  );

  return data.access_token;
}

// Main function: get a valid access token (refreshed if needed)
export async function getValidAccessToken(tutorId: number): Promise<string> {
  const tokens = await getStoredTokens(tutorId);
  if (!tokens) throw new Error("Tutor not authenticated with Zoom");

  // If token is still valid (with 5 min buffer)
  if (tokens.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return tokens.accessToken;
  }

  // Otherwise refresh
  return await refreshAccessToken(tutorId, tokens.refreshToken);
}

// ---------- Meeting CRUD ----------

interface CreateMeetingParams {
  topic?: string;
  startTime: Date;
  duration: number; // minutes
  timezone?: string;
}

export async function createZoomMeeting(
  tutorId: number,
  params: CreateMeetingParams,
) {
  const accessToken = await getValidAccessToken(tutorId);

  const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      topic: params.topic || "Session",
      type: 2, // scheduled meeting
      start_time: params.startTime.toISOString(),
      duration: params.duration,
      timezone: params.timezone || "UTC",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        waiting_room: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Zoom create meeting failed: ${JSON.stringify(error)}`);
  }

  const meeting = await response.json();

  return {
    id: String(meeting.id),
    joinUrl: meeting.join_url,
    uuid: meeting.uuid,
    startUrl: meeting.start_url,
  };
}

export async function updateZoomMeeting(
  meetingId: string,
  tutorId: number,
  params: Partial<CreateMeetingParams>,
) {
  const accessToken = await getValidAccessToken(tutorId);

  const body: Record<string, unknown> = {};
  if (params.topic) body.topic = params.topic;
  if (params.startTime) body.start_time = params.startTime.toISOString();
  if (params.duration) body.duration = params.duration;
  if (params.timezone) body.timezone = params.timezone;

  const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Zoom update meeting failed: ${JSON.stringify(error)}`);
  }
}

export async function deleteZoomMeeting(meetingId: string, tutorId: number) {
  const accessToken = await getValidAccessToken(tutorId);

  const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(`Zoom delete meeting failed: ${JSON.stringify(error)}`);
  }
}
