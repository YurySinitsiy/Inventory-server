/*
  Warnings:

  - The primary key for the `Salesforce` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `salesforceToken` on the `Salesforce` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Salesforce" DROP CONSTRAINT "Salesforce_profileId_fkey";

-- AlterTable
ALTER TABLE "public"."Salesforce" DROP CONSTRAINT "Salesforce_pkey",
DROP COLUMN "salesforceToken",
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "instanceUrl" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Salesforce_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."Salesforce" ADD CONSTRAINT "Salesforce_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
