/*
  Warnings:

  - You are about to drop the column `email` on the `Salesforce` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Salesforce" DROP COLUMN "email",
ADD COLUMN     "accountNmae" TEXT,
ADD COLUMN     "phone" TEXT;
