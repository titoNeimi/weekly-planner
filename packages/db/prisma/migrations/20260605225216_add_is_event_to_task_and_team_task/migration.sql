-- AlterTable
ALTER TABLE "RecurringTask" ADD COLUMN     "isEvent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isEvent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TeamTask" ADD COLUMN     "isEvent" BOOLEAN NOT NULL DEFAULT false;
