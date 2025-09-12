/*
  Warnings:

  - You are about to drop the column `salesforceToken` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `salesforceTokenExp` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."profiles" DROP COLUMN "salesforceToken",
DROP COLUMN "salesforceTokenExp";
