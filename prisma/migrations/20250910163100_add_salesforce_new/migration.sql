/*
  Warnings:

  - You are about to drop the column `salesforceId` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."profiles" DROP COLUMN "salesforceId";

-- CreateTable
CREATE TABLE "public"."Salesforce" (
    "id" UUID NOT NULL,
    "salesforceId" TEXT,
    "salesforceToken" TEXT,
    "profileId" UUID NOT NULL,

    CONSTRAINT "Salesforce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Salesforce_profileId_key" ON "public"."Salesforce"("profileId");

-- AddForeignKey
ALTER TABLE "public"."Salesforce" ADD CONSTRAINT "Salesforce_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
