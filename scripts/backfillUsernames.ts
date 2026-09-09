/**
 * One-off backfill: derive a unique Latin `username` for every existing user
 * that doesn't have one. Idempotent — safe to run again.
 *
 * Derivation priority:
 *  1. Email local-part (sanitized to [a-z0-9._], lowercase).
 *  2. Collision/missing  -> append `_1`, `_2`, ... until free.
 *  3. Still not free     -> fall back to `user{id}`.
 *
 * Run with:  pnpm tsx scripts/backfillUsernames.ts
 */
import "dotenv/config";
import db from "@/lib/prisma";

const slugify = (input: string): string => {
  const local = input.split("@")[0] ?? "";
  return local
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 30);
};

async function main() {
  const users = await db.user.findMany({
    where: { username: null },
    orderBy: { id: "asc" },
  });

  const taken = new Set(
    (
      await db.user.findMany({
        where: { username: { not: null } },
        select: { username: true },
      })
    ).map((u) => u.username as string),
  );

  let assigned = 0;
  for (const u of users) {
    let base = slugify(u.email ?? "");
    if (!base) base = `user${u.id}`;
    if (base.length < 3) base = `${base}${u.id}`;

    let candidate = base;
    let n = 1;
    while (taken.has(candidate)) {
      candidate = `${base}_${n}`;
      n += 1;
    }
    taken.add(candidate);

    await db.user.update({
      where: { id: u.id },
      data: { username: candidate },
    });
    assigned += 1;
  }

  console.log(`✅ Assigned usernames to ${assigned} users`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});