-- DropForeignKey
ALTER TABLE "public"."Salesforce" DROP CONSTRAINT "Salesforce_profileId_fkey";

-- CreateTable
CREATE TABLE "public"."Odoo" (
    "id" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "apiToken" TEXT,

    CONSTRAINT "Odoo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Odoo_profileId_key" ON "public"."Odoo"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Odoo_apiToken_key" ON "public"."Odoo"("apiToken");

-- AddForeignKey
ALTER TABLE "public"."Salesforce" ADD CONSTRAINT "Salesforce_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Odoo" ADD CONSTRAINT "Odoo_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
