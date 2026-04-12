-- Add youtube to Platform enum
ALTER TYPE "Platform" ADD VALUE 'youtube';

-- Rename columns for multi-platform support
ALTER TABLE "Creator" RENAME COLUMN "mid" TO "platformId";
ALTER TABLE "Video" RENAME COLUMN "bvid" TO "videoId";

-- Drop old unique constraints
DROP INDEX IF EXISTS "Creator_mid_key";
DROP INDEX IF EXISTS "Video_bvid_key";

-- Create composite unique constraints
CREATE UNIQUE INDEX "Creator_platform_platformId_key" ON "Creator"("platform", "platformId");
CREATE UNIQUE INDEX "Video_platform_videoId_key" ON "Video"("platform", "videoId");

-- Add platform indexes for filtering
CREATE INDEX "Creator_platform_idx" ON "Creator"("platform");
CREATE INDEX "Video_platform_idx" ON "Video"("platform");