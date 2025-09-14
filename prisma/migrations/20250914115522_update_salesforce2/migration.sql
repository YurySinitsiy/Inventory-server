/*
  Warnings:

  - You are about to drop the column `contactId` on the `Salesforce` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Salesforce" DROP COLUMN "contactId",
ADD COLUMN     "accountId" TEXT;
