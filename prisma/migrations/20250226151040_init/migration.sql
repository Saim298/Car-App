/*
  Warnings:

  - The primary key for the `Dealer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DealerMetric` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Dealer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `DealerMetric` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `dealer_id` on the `DealerMetric` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `dealer_id` on the `Listing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "DealerMetric" DROP CONSTRAINT "DealerMetric_dealer_id_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_dealer_id_fkey";

-- AlterTable
ALTER TABLE "Dealer" DROP CONSTRAINT "Dealer_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" INTEGER NOT NULL,
ADD CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DealerMetric" DROP CONSTRAINT "DealerMetric_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" INTEGER NOT NULL,
DROP COLUMN "dealer_id",
ADD COLUMN     "dealer_id" INTEGER NOT NULL,
ADD CONSTRAINT "DealerMetric_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "dealer_id",
ADD COLUMN     "dealer_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerMetric" ADD CONSTRAINT "DealerMetric_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
