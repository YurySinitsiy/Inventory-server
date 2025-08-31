/*
  Warnings:

  - You are about to drop the `InventoryField` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemFieldValue` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `customIdFormat` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fields` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fields` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Inventory" DROP CONSTRAINT "Inventory_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InventoryField" DROP CONSTRAINT "InventoryField_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ItemFieldValue" DROP CONSTRAINT "ItemFieldValue_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ItemFieldValue" DROP CONSTRAINT "ItemFieldValue_itemId_fkey";

-- DropIndex
DROP INDEX "public"."profiles_email_key";

-- AlterTable
ALTER TABLE "public"."Inventory" ADD COLUMN     "customIdFormat" JSONB NOT NULL,
ADD COLUMN     "fields" JSONB NOT NULL,
ALTER COLUMN "ownerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "fields" JSONB NOT NULL;

-- DropTable
DROP TABLE "public"."InventoryField";

-- DropTable
DROP TABLE "public"."ItemFieldValue";

-- DropEnum
DROP TYPE "public"."FieldType";
