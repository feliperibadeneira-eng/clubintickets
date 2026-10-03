/*
  Warnings:

  - You are about to drop the `BuyerLoginToken` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `passwordHash` to the `Buyer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BuyerLoginToken" DROP CONSTRAINT "BuyerLoginToken_buyerId_fkey";

-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- DropTable
DROP TABLE "BuyerLoginToken";
