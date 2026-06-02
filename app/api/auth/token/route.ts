import { getTokenFromCookie } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ token: null }, { status: 401 });
  }
  return NextResponse.json({ token });
}
