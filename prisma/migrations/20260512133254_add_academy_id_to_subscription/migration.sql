-- 1. Add as nullable
ALTER TABLE "Subscription" ADD COLUMN "academyId" INTEGER;

-- 2. Populate existing rows from the plan's academy
UPDATE "Subscription" s
SET "academyId" = p."academyId"
FROM "Plan" p
WHERE s."planId" = p.id;

-- 3. Now set NOT NULL
ALTER TABLE "Subscription" ALTER COLUMN "academyId" SET NOT NULL;

-- 4. Add foreign key constraint
ALTER TABLE "Subscription" 
ADD CONSTRAINT "Subscription_academyId_fkey" 
FOREIGN KEY ("academyId") 
REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;