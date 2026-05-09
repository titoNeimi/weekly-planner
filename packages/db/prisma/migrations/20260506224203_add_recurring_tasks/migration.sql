-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('ANNUAL', 'WEEKLY', 'DAILY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "recurringTaskId" TEXT;

-- CreateTable
CREATE TABLE "RecurringTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RecurringType" NOT NULL,
    "interval" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "endCount" INTEGER,

    CONSTRAINT "RecurringTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_recurringTaskId_fkey" FOREIGN KEY ("recurringTaskId") REFERENCES "RecurringTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
