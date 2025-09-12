/*
  Warnings:

  - You are about to drop the column `accountNmae` on the `Salesforce` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Salesforce" DROP COLUMN "accountNmae",
ADD COLUMN     "accountName" TEXT;
