import { vi } from "vitest";

/**
 * Shared mutable state bridging the mocked `next/headers` cookies and the
 * real auth pipeline (`getTokenFromCookie` -> `verifyToken` -> `user()`).
 *
 * Tests call `setAuthToken(token)` to simulate a logged-in session; the
 * mock cookie store in tests/setup.ts reads it from globalThis.
 */
interface AuthState {
  token: string | undefined;
}

declare global {
  var __taysirAuth: AuthState | undefined;
}

vi.hoisted(() => {
  globalThis.__taysirAuth = { token: undefined } satisfies AuthState;
});

export function setAuthToken(token: string | undefined): void {
  globalThis.__taysirAuth!.token = token;
}

export function getAuthToken(): string | undefined {
  return globalThis.__taysirAuth!.token;
}