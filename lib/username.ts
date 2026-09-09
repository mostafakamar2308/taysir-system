import { slugify } from "transliteration";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(input: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(input));
}

/** Transliterate a (usually Arabic) name into a Latin username base. */
export function usernameBaseFromName(name: string): string {
  const base = slugify(name, {
    lowercase: true,
    separator: "",
    allowedChars: "a-zA-Z0-9",
  })
    .replace(/^[._]+|[._]+$/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  return base.replace(/^[0-9]+/, "");
}

/** For non-ASCII names, produce a fallback latin-ish base from words. */
export function usernameFallbackBase(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .slice(0, 20);
}

/**
 * Returns up to `max` unique, non-taken username candidates derived from
 * `base`. The first candidate is always `base` if it is free/sanitized.
 */
export function buildUsernameSuggestions(
  base: string,
  taken: Set<string>,
  max = 4,
): string[] {
  const candidates: string[] = [];
  const push = (candidate: string) => {
    const c = candidate.replace(/^[._]+|[._]+$/g, "").slice(0, 30);
    if (isValidUsername(c) && !taken.has(c) && !candidates.includes(c)) {
      candidates.push(c);
    }
  };

  for (let n = 1; ; n += 1) {
    if (n === 1) push(base);
    push(`${base}${n}`);
    if (n > 99 || candidates.length >= max) break;
  }

  return candidates.slice(0, max);
}