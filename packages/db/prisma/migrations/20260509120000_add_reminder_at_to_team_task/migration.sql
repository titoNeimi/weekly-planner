-- AlterTable
ALTER TABLE "TeamTask" ADD COLUMN "reminderAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TeamTask_done_reminderSentAt_reminderAt_idx" ON "TeamTask"("done", "reminderSentAt", "reminderAt");

-- Backfill reminderAt for existing pending tasks that have a category with reminderHours
UPDATE "TeamTask" tt
SET "reminderAt" = tt.date - (tc."reminderHours" * interval '1 hour')
FROM "TeamCategory" tc
WHERE tt."teamCategoryId" = tc.id
  AND tc."reminderHours" IS NOT NULL
  AND tt."reminderSentAt" IS NULL
  AND tt.done = false;
