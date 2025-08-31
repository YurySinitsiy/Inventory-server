/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `fields` on the `Inventory` table. All the data in the column will be lost.
  - Changed the type of `ownerId` on the `Inventory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."FieldType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN');

-- DropForeignKey
ALTER TABLE "public"."Inventory" DROP CONSTRAINT "Inventory_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."Inventory" DROP COLUMN "categoryId",
DROP COLUMN "fields",
ADD COLUMN     "category" TEXT,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "public"."InventoryField" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."FieldType" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "InventoryField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemFieldValue" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "valueStr" TEXT,
    "valueNum" DOUBLE PRECISION,
    "valueBool" BOOLEAN,

    CONSTRAINT "ItemFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryField_inventoryId_name_key" ON "public"."InventoryField"("inventoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemFieldValue_itemId_fieldId_key" ON "public"."ItemFieldValue"("itemId", "fieldId");

-- AddForeignKey
ALTER TABLE "public"."InventoryField" ADD CONSTRAINT "InventoryField_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemFieldValue" ADD CONSTRAINT "ItemFieldValue_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemFieldValue" ADD CONSTRAINT "ItemFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."InventoryField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
