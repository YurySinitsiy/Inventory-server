-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "surname" TEXT,
    "role" TEXT DEFAULT 'user',
    "status" TEXT DEFAULT 'unblocked',
    "email" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inventory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Inventory',
    "description" TEXT NOT NULL DEFAULT 'Description',
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "customIdFormat" JSONB NOT NULL,
    "fields" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryUser" (
    "inventoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InventoryUser_pkey" PRIMARY KEY ("inventoryId","userId")
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Like" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_inventoryId_customId_key" ON "public"."Item"("inventoryId", "customId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_itemId_userId_key" ON "public"."Like"("itemId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryUser" ADD CONSTRAINT "InventoryUser_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
