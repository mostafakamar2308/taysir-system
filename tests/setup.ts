import "dotenv/config";
import { vi } from "vitest";

// Server actions call next/cache revalidatePath() — no-op in tests.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Simulate the Next.js request cookie context. The token value is read from
// globalThis.__taysirAuth (set by tests/helpers/auth.ts::setAuthToken).
declare global {
  var __taysirAuth: { token: string | undefined } | undefined;
}

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const token = globalThis.__taysirAuth?.token;
      if (name === "token" && token) return { name, value: token };
      return undefined;
    },
    set: () => {},
    delete: () => {},
  }),
}));