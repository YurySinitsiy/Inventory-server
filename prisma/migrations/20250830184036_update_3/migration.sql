/*
  Warnings:

  - You are about to drop the `InventoryField` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemFieldValue` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."FieldSlot" AS ENUM ('TEXT1', 'TEXT2', 'TEXT3', 'MULTILINE1', 'MULTILINE2', 'MULTILINE3', 'NUMBER1', 'NUMBER2', 'NUMBER3', 'LINK1', 'LINK2', 'LINK3', 'BOOLEAN1', 'BOOLEAN2', 'BOOLEAN3');

-- DropForeignKey
ALTER TABLE "public"."InventoryField" DROP CONSTRAINT "InventoryField_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ItemFieldValue" DROP CONSTRAINT "ItemFieldValue_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ItemFieldValue" DROP CONSTRAINT "ItemFieldValue_itemId_fkey";

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "boolean1" BOOLEAN,
ADD COLUMN     "boolean2" BOOLEAN,
ADD COLUMN     "boolean3" BOOLEAN,
ADD COLUMN     "link1" TEXT,
ADD COLUMN     "link2" TEXT,
ADD COLUMN     "link3" TEXT,
ADD COLUMN     "multiline1" TEXT,
ADD COLUMN     "multiline2" TEXT,
ADD COLUMN     "multiline3" TEXT,
ADD COLUMN     "number1" DOUBLE PRECISION,
ADD COLUMN     "number2" DOUBLE PRECISION,
ADD COLUMN     "number3" DOUBLE PRECISION,
ADD COLUMN     "text1" TEXT,
ADD COLUMN     "text2" TEXT,
ADD COLUMN     "text3" TEXT;

-- DropTable
DROP TABLE "public"."InventoryField";

-- DropTable
DROP TABLE "public"."ItemFieldValue";

-- DropEnum
DROP TYPE "public"."FieldType";

-- CreateTable
CREATE TABLE "public"."InventoryFieldConfig" (
    "inventoryId" TEXT NOT NULL,
    "slot" "public"."FieldSlot" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibleInTable" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,

    CONSTRAINT "InventoryFieldConfig_pkey" PRIMARY KEY ("inventoryId","slot")
);

-- AddForeignKey
ALTER TABLE "public"."InventoryFieldConfig" ADD CONSTRAINT "InventoryFieldConfig_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
