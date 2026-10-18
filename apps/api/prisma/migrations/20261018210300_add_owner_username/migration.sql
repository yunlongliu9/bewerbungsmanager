-- AlterTable
ALTER TABLE "owners" ADD COLUMN "username" VARCHAR(64);

-- Backfill existing email-based owners so their account remains usable.
UPDATE "owners" SET "username" = "email" WHERE "username" IS NULL;

-- AlterTable
ALTER TABLE "owners" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "owners" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "owners_username_key" ON "owners"("username");
