/*
  Warnings:

  - You are about to drop the column `category` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `customIdFormat` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `fields` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `fields` on the `Item` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."FieldType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN');

-- AlterTable
ALTER TABLE "public"."Inventory" DROP COLUMN "category",
DROP COLUMN "customIdFormat",
DROP COLUMN "fields",
ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "fields";

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
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryField" ADD CONSTRAINT "InventoryField_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemFieldValue" ADD CONSTRAINT "ItemFieldValue_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemFieldValue" ADD CONSTRAINT "ItemFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."InventoryField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
