/*
  Warnings:

  - A unique constraint covering the columns `[userId,type]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_type_key" ON "Agent"("userId", "type");
