-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InventoryTag" DROP CONSTRAINT "InventoryTag_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InventoryTag" DROP CONSTRAINT "InventoryTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InventoryUser" DROP CONSTRAINT "InventoryUser_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_inventoryId_fkey";

-- AddForeignKey
ALTER TABLE "public"."InventoryUser" ADD CONSTRAINT "InventoryUser_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTag" ADD CONSTRAINT "InventoryTag_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTag" ADD CONSTRAINT "InventoryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
