/**
 * Minimal helper for surfacing Prisma errors (e.g. unique constraint
 * violations) as user-friendly messages in server actions.
 */
export function isPrismaError(
  err: unknown,
): err is { code: string; meta?: { target?: string[] } } {
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { code?: unknown }).code === "string"
  );
}

/** Returns the unique-constraint target field, or null if it isn't a P2002. */
export function uniqueViolationField(
  err: unknown,
): string[] | null {
  if (!isPrismaError(err) || err.code !== "P2002") return null;
  return err.meta?.target ?? null;
}