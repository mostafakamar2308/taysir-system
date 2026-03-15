import { getTokenFromCookie, TokenPayload, verifyToken } from "@/lib/jwt";

export const user: () => Promise<TokenPayload | null> = async () => {
  const token = await getTokenFromCookie();
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return payload;
};
