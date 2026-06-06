-- AlterTable
ALTER TABLE "Team" ADD COLUMN "discordGuildId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_discordGuildId_key" ON "Team"("discordGuildId");
