/*
  Warnings:

  - You are about to drop the column `tags` on the `Inventory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Inventory" DROP CONSTRAINT "Inventory_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."Inventory" DROP COLUMN "tags",
ALTER COLUMN "title" DROP DEFAULT,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryTag" (
    "inventoryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "InventoryTag_pkey" PRIMARY KEY ("inventoryId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTag" ADD CONSTRAINT "InventoryTag_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTag" ADD CONSTRAINT "InventoryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
