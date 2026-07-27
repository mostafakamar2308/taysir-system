-- ============================================================
-- 1. New tables (Group, GroupStudent, TutorAttendance)
-- ============================================================

CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "academyId" INTEGER NOT NULL,
    "tutorId" INTEGER NOT NULL,
    "tutorHourlyRate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupStudent" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "customRate" DOUBLE PRECISION,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroupStudent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TutorAttendance" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "notes" TEXT,
    "reviewedBy" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TutorAttendance_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- 2. Preserve Tutor rate data: RENAME, never drop+add
-- ============================================================

ALTER TABLE "Tutor" RENAME COLUMN "privatePricePerHour" TO "baseHourlyRate";
ALTER TABLE "Tutor" RENAME COLUMN "groupPricePerHour" TO "baseGroupHourlyRate";
ALTER TABLE "Tutor" ADD COLUMN "defaultSupervisorId" INTEGER;

-- ============================================================
-- 3. Add new Session columns as NULLABLE first (backfill before locking)
-- ============================================================

ALTER TABLE "Session" ADD COLUMN "groupId" INTEGER;
ALTER TABLE "Session" ADD COLUMN "supervisorId" INTEGER;

-- Temp column used only to correlate inserted groups back to their student set.
-- Dropped at the end of this script.
ALTER TABLE "Group" ADD COLUMN "_migrationStudentIds" INTEGER[];

-- ============================================================
-- 3b. No academy has a Supervisor yet. Create one placeholder User + Supervisor
--     per academy so tutors have someone to default to. The password is a
--     placeholder only — force a reset before this account is actually used,
--     and rename/reassign it to a real person per academy afterward.
-- ============================================================

WITH new_users AS (
  INSERT INTO "User" ("email", "password", "name", "role", "timezone", "preferredLanguage", "createdAt", "updatedAt")
  SELECT
    'supervisor-placeholder+academy' || a.id || '@academiyati.internal',
    '$placeholder$-reset-before-use',
    'Placeholder supervisor',
    -- use whatever role code your app assigns to supervisors
    3,
    'Africa/Cairo',
    'ar',
    now(), now()
  FROM "Academy" a
  RETURNING id, email
)
INSERT INTO "Supervisor" ("userId", "academyId", "createdAt", "updatedAt")
SELECT nu.id, a.id, now(), now()
FROM new_users nu
JOIN "Academy" a ON nu.email = 'supervisor-placeholder+academy' || a.id || '@academiyati.internal';

-- ============================================================
-- 4. Give every tutor a default supervisor (first supervisor in their academy)
--    Adjust this manually afterward if a tutor needs a specific supervisor.
-- ============================================================

UPDATE "Tutor" t
SET "defaultSupervisorId" = (
  SELECT MIN(s.id) FROM "Supervisor" s WHERE s."academyId" = t."academyId"
)
WHERE t."defaultSupervisorId" IS NULL;

-- ============================================================
-- 5. Reconstruct groups from real session history:
--    one Group per distinct (tutor, exact set of students who sat together)
-- ============================================================

WITH session_sets AS (
  SELECT
    s.id AS "sessionId",
    s."tutorId",
    s."academyId",
    array_agg(DISTINCT sp."studentId" ORDER BY sp."studentId") AS student_ids
  FROM "Session" s
  JOIN "SessionParticipant" sp ON sp."sessionId" = s.id
  GROUP BY s.id, s."tutorId", s."academyId"
)
INSERT INTO "Group" ("academyId", "tutorId", "active", "_migrationStudentIds", "createdAt", "updatedAt")
SELECT "academyId", "tutorId", true, student_ids, now(), now()
FROM session_sets
GROUP BY "academyId", "tutorId", student_ids;

-- Fallback: sessions that (unusually) have no participants get one shared
-- "no roster" group per tutor, so they still get a groupId.
INSERT INTO "Group" ("academyId", "tutorId", "active", "createdAt", "updatedAt")
SELECT DISTINCT s."academyId", s."tutorId", true, now(), now()
FROM "Session" s
WHERE NOT EXISTS (SELECT 1 FROM "SessionParticipant" sp WHERE sp."sessionId" = s.id)
  AND NOT EXISTS (
    SELECT 1 FROM "Group" g WHERE g."tutorId" = s."tutorId" AND g."_migrationStudentIds" IS NULL
  );

-- Fallback: students with a legacy tutor assignment but no session history yet.
-- Each such student gets their OWN group (not collapsed with others on the
-- same tutor), since there's no history to prove they belong together.
-- Stored one-elemnt array in the temp column so the next step can correlate
-- each new group back to the exact student it was made for.
-- Excludes StudentStatus.lead (0) and StudentStatus.trial (1) — those
-- students don't get a group until they actually subscribe or attend a session.
INSERT INTO "Group" ("academyId", "tutorId", "active", "_migrationStudentIds", "createdAt", "updatedAt")
SELECT st."academyId", st."tutorId", true, ARRAY[st.id], now(), now()
FROM "Student" st
WHERE st."tutorId" IS NOT NULL
  AND st.status NOT IN (0, 1) -- exclude lead and trial students
  AND NOT EXISTS (
    SELECT 1 FROM "SessionParticipant" sp WHERE sp."studentId" = st.id
  );

-- ============================================================
-- 6. Populate GroupStudent from the reconstructed rosters
-- ============================================================

INSERT INTO "GroupStudent" ("groupId", "studentId", "active", "joinedAt", "createdAt", "updatedAt")
SELECT g.id, unnest(g."_migrationStudentIds"), true, now(), now(), now()
FROM "Group" g
WHERE g."_migrationStudentIds" IS NOT NULL;

-- ============================================================
-- 7. Point every Session at its reconstructed group
-- ============================================================

WITH session_sets AS (
  SELECT
    s.id AS "sessionId",
    s."tutorId",
    s."academyId",
    array_agg(DISTINCT sp."studentId" ORDER BY sp."studentId") AS student_ids
  FROM "Session" s
  JOIN "SessionParticipant" sp ON sp."sessionId" = s.id
  GROUP BY s.id, s."tutorId", s."academyId"
)
UPDATE "Session" s
SET "groupId" = g.id
FROM session_sets ss
JOIN "Group" g
  ON g."academyId" = ss."academyId"
 AND g."tutorId" = ss."tutorId"
 AND g."_migrationStudentIds" = ss.student_ids
WHERE s.id = ss."sessionId";

UPDATE "Session" s
SET "groupId" = g.id
FROM "Group" g
WHERE s."groupId" IS NULL
  AND g."tutorId" = s."tutorId"
  AND g."_migrationStudentIds" IS NULL;

-- ============================================================
-- 8. Backfill supervisorId from each session's tutor's default supervisor
-- ============================================================

UPDATE "Session" s
SET "supervisorId" = t."defaultSupervisorId"
FROM "Group" g
JOIN "Tutor" t ON t.id = g."tutorId"
WHERE s."groupId" = g.id AND s."supervisorId" IS NULL;

-- ============================================================
-- 9. Drop the temp correlation column now that backfill is done
-- ============================================================

ALTER TABLE "Group" DROP COLUMN "_migrationStudentIds";

-- ============================================================
-- 10. Lock down NOT NULL now that every row has a real value
-- ============================================================

ALTER TABLE "Session" ALTER COLUMN "groupId" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "supervisorId" SET NOT NULL;

-- ============================================================
-- 11. Drop superseded columns
-- ============================================================

ALTER TABLE "Session" DROP COLUMN "tutorId";
ALTER TABLE "Student" DROP COLUMN "tutorId";

-- ============================================================
-- 12. Indexes and foreign keys
-- ============================================================

CREATE INDEX "Group_tutorId_idx" ON "Group"("tutorId");
CREATE INDEX "Group_academyId_idx" ON "Group"("academyId");

CREATE UNIQUE INDEX "GroupStudent_groupId_studentId_key" ON "GroupStudent"("groupId", "studentId");
CREATE INDEX "GroupStudent_groupId_idx" ON "GroupStudent"("groupId");
CREATE INDEX "GroupStudent_studentId_idx" ON "GroupStudent"("studentId");

CREATE UNIQUE INDEX "TutorAttendance_sessionId_key" ON "TutorAttendance"("sessionId");
CREATE INDEX "TutorAttendance_sessionId_idx" ON "TutorAttendance"("sessionId");
CREATE INDEX "TutorAttendance_reviewedBy_idx" ON "TutorAttendance"("reviewedBy");

CREATE INDEX "Session_groupId_idx" ON "Session"("groupId");
CREATE INDEX "Session_supervisorId_idx" ON "Session"("supervisorId");

CREATE INDEX "Tutor_defaultSupervisorId_idx" ON "Tutor"("defaultSupervisorId");

ALTER TABLE "Group" ADD CONSTRAINT "Group_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Group" ADD CONSTRAINT "Group_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GroupStudent" ADD CONSTRAINT "GroupStudent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupStudent" ADD CONSTRAINT "GroupStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TutorAttendance" ADD CONSTRAINT "TutorAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorAttendance" ADD CONSTRAINT "TutorAttendance_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "Supervisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_defaultSupervisorId_fkey" FOREIGN KEY ("defaultSupervisorId") REFERENCES "Supervisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;