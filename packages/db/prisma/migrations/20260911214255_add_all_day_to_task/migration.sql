-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RecurringTask" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false;
