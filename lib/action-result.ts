import type { ActionResult } from "@/types/action";

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string): never {
  throw new ActionError(error);
}

function isFrameworkError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const digest = (err as { digest?: unknown }).digest;
  if (typeof digest !== "string") return false;
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_NOT_FOUND") ||
    digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")
  );
}

export function withResult<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
) {
  return async (...args: Args): Promise<ActionResult<T>> => {
    try {
      return ok(await fn(...args));
    } catch (err) {
      if (err instanceof ActionError) {
        return { ok: false, error: err.message };
      }
      if (isFrameworkError(err)) throw err;
      console.error("[action error]", err);
      return { ok: false, error: "حدث خطأ غير متوقع" };
    }
  };
}
