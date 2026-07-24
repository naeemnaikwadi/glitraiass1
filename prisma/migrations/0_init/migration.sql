-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referenceImage" TEXT NOT NULL,
    "generatedPrompt" TEXT,
    "generatedImage" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");
