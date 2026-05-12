import { redis as connection } from "@/lib/redis";

const REST_THRESHOLD = 75; // send 75 messages, then rest
const MIN_REST_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REST_MS = 15 * 60 * 1000; // 15 minutes
const MIN_DELAY_MS = 15 * 1000; // 15 seconds
const MAX_DELAY_MS = 45 * 1000; // 45 seconds

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Wait (sleep) for a given number of milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get or initialise per‑academy counters from Redis
 */
async function getAcademyState(
  academyId: number,
): Promise<{ count: number; restUntil: number }> {
  const key = `whatsapp:academy:${academyId}`;
  const data = await connection.hgetall(key);
  if (!data || Object.keys(data).length === 0) {
    // initialise
    await connection.hset(key, {
      count: 0,
      restUntil: 0,
    });
    await connection.expire(key, 86400);
    return { count: 0, restUntil: 0 };
  }
  return {
    count: parseInt(data.count || "0"),
    restUntil: parseInt(data.restUntil || "0"),
  };
}

/**
 * Update counters after a message is sent
 */
async function incrementAcademyCount(academyId: number): Promise<number> {
  const key = `whatsapp:academy:${academyId}`;
  const newCount = await connection.hincrby(key, "count", 1);
  return newCount;
}

/**
 * Reset counters and set a rest period
 */
async function setAcademyRest(academyId: number): Promise<void> {
  const key = `whatsapp:academy:${academyId}`;
  const restDuration = randomDelay(MIN_REST_MS, MAX_REST_MS);
  const restUntil = Date.now() + restDuration;
  await connection.hset(key, {
    count: 0,
    restUntil: restUntil,
  });
}

/**
 * Main throttling function: call this BEFORE sending a message for an academy.
 * It will:
 *   - wait if the academy is in a rest period
 *   - wait a random delay (15‑45s) since the last message
 *   - automatically enforce rest after the threshold
 *
 * Returns a cleanup function that MUST be called after sending (to increment count).
 */
export async function throttleAcademy(
  academyId: number,
): Promise<() => Promise<void>> {
  const key = `whatsapp:academy:${academyId}`;

  // Use a lock to prevent concurrent throttling for the same academy
  const lockKey = `${key}:lock`;
  const lockTtl = 30_000; // 30 seconds max lock
  const lockValue = `${Date.now()}`;
  const acquired = await connection.set(
    lockKey,
    lockValue,
    "PX",
    lockTtl,
    "NX",
  );

  if (!acquired) {
    // Another worker is already processing this academy – wait and retry
    await sleep(200);
    return throttleAcademy(academyId);
  }

  try {
    // 1. Check rest period
    const { restUntil } = await getAcademyState(academyId);
    const now = Date.now();
    if (restUntil > now) {
      const remaining = restUntil - now;
      console.log(
        `⏳ Academy ${academyId} is resting for ${Math.ceil(remaining / 1000)}s more`,
      );
      await sleep(remaining);
    }

    // 2. Get last message timestamp from Redis (to compute delay since last message)
    const lastSentKey = `${key}:lastSent`;
    const lastSent = await connection.get(lastSentKey);
    const lastSentTime = lastSent ? parseInt(lastSent) : 0;
    const timeSinceLast = now - lastSentTime;

    // Minimum required delay between messages (15‑45s)
    const requiredDelay = randomDelay(MIN_DELAY_MS, MAX_DELAY_MS);
    if (timeSinceLast < requiredDelay && lastSentTime > 0) {
      const wait = requiredDelay - timeSinceLast;
      console.log(
        `⏳ Academy ${academyId} waiting ${Math.ceil(wait / 1000)}s before next message`,
      );
      await sleep(wait);
    }

    // 3. Update last sent timestamp
    await connection.set(lastSentKey, Date.now());

    // 4. Return a post-send function that increments count and possibly triggers rest
    const postSend = async () => {
      const newCount = await incrementAcademyCount(academyId);
      if (newCount >= REST_THRESHOLD) {
        console.log(
          `🛑 Academy ${academyId} reached ${newCount} messages – entering rest period`,
        );
        await setAcademyRest(academyId);
      }
      // Release lock
      await connection.del(lockKey);
    };

    return postSend;
  } catch (err) {
    // Always release lock on error
    await connection.del(lockKey);
    throw err;
  }
}
