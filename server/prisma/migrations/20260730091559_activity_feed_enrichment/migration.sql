-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAction" ADD VALUE 'LOGIN';
ALTER TYPE "AdminAction" ADD VALUE 'LOGOUT';
ALTER TYPE "AdminAction" ADD VALUE 'DOWNLOAD';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminEntity" ADD VALUE 'QR';
ALTER TYPE "AdminEntity" ADD VALUE 'SYSTEM';

-- AlterTable
ALTER TABLE "admin_activities" ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Activity',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'SYSTEM';

-- CreateIndex
CREATE INDEX "admin_activities_action_idx" ON "admin_activities"("action");

-- CreateIndex
CREATE INDEX "admin_activities_entity_idx" ON "admin_activities"("entity");

-- CreateIndex
CREATE INDEX "admin_activities_type_idx" ON "admin_activities"("type");
