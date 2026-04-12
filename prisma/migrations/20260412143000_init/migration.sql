-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('bilibili');

-- CreateEnum
CREATE TYPE "JobName" AS ENUM ('fetch_videos', 'send_digest');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('success', 'partial', 'failed');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'bilibili',
    "mid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'bilibili',
    "bvid" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "jobName" "JobName" NOT NULL,
    "status" "JobStatus" NOT NULL,
    "summary" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestSendLog" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestSendLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_mid_key" ON "Creator"("mid");

-- CreateIndex
CREATE INDEX "Creator_enabled_idx" ON "Creator"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Video_bvid_key" ON "Video"("bvid");

-- CreateIndex
CREATE INDEX "Video_creatorId_publishedAt_idx" ON "Video"("creatorId", "publishedAt");

-- CreateIndex
CREATE INDEX "Video_publishedAt_idx" ON "Video"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "Subscriber_enabled_idx" ON "Subscriber"("enabled");

-- CreateIndex
CREATE INDEX "JobLog_jobName_createdAt_idx" ON "JobLog"("jobName", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DigestSendLog_subscriberId_dateKey_key" ON "DigestSendLog"("subscriberId", "dateKey");

-- CreateIndex
CREATE INDEX "DigestSendLog_dateKey_createdAt_idx" ON "DigestSendLog"("dateKey", "createdAt");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestSendLog" ADD CONSTRAINT "DigestSendLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
