/*
  Warnings:

  - The values [TEXT1,TEXT2,TEXT3,MULTILINE1,MULTILINE2,MULTILINE3,NUMBER1,NUMBER2,NUMBER3,LINK1,LINK2,LINK3,BOOLEAN1,BOOLEAN2,BOOLEAN3] on the enum `FieldSlot` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."FieldSlot_new" AS ENUM ('text1', 'text2', 'text3', 'multiline1', 'multiline2', 'multiline3', 'number1', 'number2', 'number3', 'link1', 'link2', 'link3', 'boolean1', 'boolean2', 'boolean3');
ALTER TABLE "public"."InventoryFieldConfig" ALTER COLUMN "slot" TYPE "public"."FieldSlot_new" USING ("slot"::text::"public"."FieldSlot_new");
ALTER TYPE "public"."FieldSlot" RENAME TO "FieldSlot_old";
ALTER TYPE "public"."FieldSlot_new" RENAME TO "FieldSlot";
DROP TYPE "public"."FieldSlot_old";
COMMIT;
