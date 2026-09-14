import { describe, it, expect, beforeEach, afterEach } from "vitest";
import db from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { seed, cleanupWorld } from "./helpers/seed";
import type { TestWorld } from "./helpers/seed";
import {
  createTimeExtensionRequest,
  decideTimeExtensionRequest,
} from "@/actions/timeExtensionRequests";
import { Role } from "@/types/user";

function pastSession(w: TestWorld) {
  return db.session.create({
    data: {
      startTime: dayjs().subtract(2, "hour").toDate(),
      durationMinutes: 60,
      groupId: w.groupAId,
      tutorId: w.tutorId,
      tutorRate: 0,
      academyId: w.academyId,
    },
  });
}

describe("createTimeExtensionRequest", () => {
  let w: TestWorld;

  beforeEach(async () => {
    w = await seed();
    w.loginAs(w.tutor);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  it("creates a request for a session that has started", async () => {
    const s = await pastSession(w);
    const res = await createTimeExtensionRequest(s.id, 30);
    expect(res.ok).toBe(true);

    const req = await db.timeExtensionRequest.findFirstOrThrow({
      where: { sessionId: s.id },
    });
    expect(req.addedMinutes).toBe(30);
    expect(req.status).toBe(0); // pending
  });

  it("rejects a session that has not started yet", async () => {
    const s = await db.session.create({
      data: {
        startTime: dayjs().add(1, "day").toDate(),
        durationMinutes: 60,
        groupId: w.groupAId,
        tutorId: w.tutorId,
        tutorRate: 0,
        academyId: w.academyId,
      },
    });
    const res = await createTimeExtensionRequest(s.id, 30);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("بعد بدء الحصة");
  });

  it("rejects added minutes out of range", async () => {
    const s = await pastSession(w);
    const res0 = await createTimeExtensionRequest(s.id, 0);
    expect(res0.ok).toBe(false);
    const resBig = await createTimeExtensionRequest(s.id, 241);
    expect(resBig.ok).toBe(false);
    if (!resBig.ok) expect(resBig.error).toContain("240");
  });

  it("rejects duplicate pending requests for the same session", async () => {
    const s = await pastSession(w);
    const first = await createTimeExtensionRequest(s.id, 30);
    expect(first.ok).toBe(true);
    const second = await createTimeExtensionRequest(s.id, 45);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("معلق");
  });

  it("rejects requests from a non-session tutor", async () => {
    w.loginAs(w.tutor2);
    const s = await pastSession(w);
    const res = await createTimeExtensionRequest(s.id, 30);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("غير موجودة");
  });

  it("rejects requests for cancelled sessions", async () => {
    const s = await pastSession(w);
    await db.session.update({
      where: { id: s.id },
      data: { cancelledBy: w.admin.userId },
    });
    const res = await createTimeExtensionRequest(s.id, 30);
    expect(res.ok).toBe(false);
  });
});

describe("decideTimeExtensionRequest", () => {
  let w: TestWorld;
  let adminUser: { id: number; role: number };

  beforeEach(async () => {
    w = await seed();
    adminUser = {
      id: w.admin.userId,
      role: Role.Admin,
    };
    w.loginAs(w.admin);
  });

  afterEach(async () => {
    await cleanupWorld(w);
  });

  it("accepting extends the session duration", async () => {
    w.loginAs(w.tutor);
    const s = await pastSession(w);
    const created = await createTimeExtensionRequest(s.id, 30);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const req = await db.timeExtensionRequest.findFirstOrThrow({
      where: { sessionId: s.id },
    });

    w.loginAs(w.admin);
    const res = await decideTimeExtensionRequest(req.id, true);
    expect(res.ok).toBe(true);

    const updated = await db.session.findUnique({ where: { id: s.id } });
    expect(updated!.durationMinutes).toBe(90);
    const reqAfter = await db.timeExtensionRequest.findUnique({
      where: { id: req.id },
    });
    expect(reqAfter!.status).toBe(1); // accepted
    expect(reqAfter!.decidedById).toBe(adminUser.id);
  });

  it("rejecting leaves duration unchanged", async () => {
    w.loginAs(w.tutor);
    const s = await pastSession(w);
    await createTimeExtensionRequest(s.id, 30);
    const req = await db.timeExtensionRequest.findFirstOrThrow({
      where: { sessionId: s.id },
    });

    w.loginAs(w.admin);
    const res = await decideTimeExtensionRequest(req.id, false);
    expect(res.ok).toBe(true);

    const updated = await db.session.findUnique({ where: { id: s.id } });
    expect(updated!.durationMinutes).toBe(60);
    const reqAfter = await db.timeExtensionRequest.findUnique({
      where: { id: req.id },
    });
    expect(reqAfter!.status).toBe(2); // rejected
  });

  it("rejects deciding a request twice", async () => {
    w.loginAs(w.tutor);
    const s = await pastSession(w);
    await createTimeExtensionRequest(s.id, 30);
    const req = await db.timeExtensionRequest.findFirstOrThrow({
      where: { sessionId: s.id },
    });
    w.loginAs(w.admin);
    await decideTimeExtensionRequest(req.id, true);
    const res = await decideTimeExtensionRequest(req.id, true);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("من قبل");
  });

  it("rejects non-admin decision", async () => {
    w.loginAs(w.tutor);
    const s = await pastSession(w);
    await createTimeExtensionRequest(s.id, 30);
    const req = await db.timeExtensionRequest.findFirstOrThrow({
      where: { sessionId: s.id },
    });
    const res = await decideTimeExtensionRequest(req.id, true);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("غير مصرح");
  });

  it("BUG: accepting an extension that creates an overlap is rejected", async () => {
    w.loginAs(w.tutor);
    const s = await pastSession(w); // 2h ago, ends 1h ago
    // Another session for the same tutor overlapping the extension horizon.
    await db.session.create({
      data: {
        startTime: dayjs(s.startTime).add(30, "minute").toDate(),
        durationMinutes: 60,
        groupId: w.groupBId,
        tutorId: w.tutorId,
        tutorRate: 0,
        academyId: w.academyId,
      },
    });

    await createTimeExtensionRequest(s.id, 90); // would end 90min after original end
    const req = await db.timeExtensionRequest.findFirstOrThrow({
      where: { sessionId: s.id },
    });
    w.loginAs(w.admin);
    const res = await decideTimeExtensionRequest(req.id, true);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("تعارض");
  });
});