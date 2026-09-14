import { describe, it, expect } from "vitest";
import dayjs from "@/lib/dayjs";
import { getSessionStatus } from "@/lib/session";
import { appDayOfWeek, scheduleWallClock } from "@/lib/recurringScheduling";
import { startTimeUtc } from "./helpers/seed";
import { SessionStatus } from "@/types/session";

describe("getSessionStatus", () => {
  it("returns SCHEDULED for a future, non-cancelled session", () => {
    const status = getSessionStatus({
      cancelledBy: null,
      startTime: dayjs().add(1, "day").toDate(),
    });
    expect(status).toBe(SessionStatus.SCHEDULED);
  });

  it("returns COMPLETED for a past, non-cancelled session", () => {
    const status = getSessionStatus({
      cancelledBy: null,
      startTime: dayjs().subtract(1, "day").toDate(),
    });
    expect(status).toBe(SessionStatus.COMPLETED);
  });

  it("returns CANCELLED regardless of time when cancelled", () => {
    expect(
      getSessionStatus({ cancelledBy: 7, startTime: dayjs().add(1, "day").toDate() }),
    ).toBe(SessionStatus.CANCELLED);
    expect(
      getSessionStatus({ cancelledBy: 7, startTime: dayjs().subtract(1, "day").toDate() }),
    ).toBe(SessionStatus.CANCELLED);
  });
});

describe("appDayOfWeek (0=Saturday .. 6=Friday)", () => {
  it("maps each calendar day correctly", () => {
    const base = dayjs("2026-09-12"); // Saturday
    for (let i = 0; i < 7; i++) {
      const date = base.add(i, "day");
      expect(appDayOfWeek(date)).toBe(i);
    }
  });
});

describe("scheduleWallClock", () => {
  it("round-trips a literal-UTC stored time", () => {
    const clock = scheduleWallClock({ startTime: startTimeUtc("16:30") });
    expect(clock).toEqual({ hour: 16, minute: 30 });
  });
});