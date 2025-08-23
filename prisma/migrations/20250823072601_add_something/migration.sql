/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Inventory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Inventory" DROP CONSTRAINT "Inventory_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."Inventory" DROP COLUMN "categoryId",
ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "public"."profiles" ALTER COLUMN "id" DROP DEFAULT;
