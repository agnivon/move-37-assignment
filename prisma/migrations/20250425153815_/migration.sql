/*
  Warnings:

  - Added the required column `renderedVideoId` to the `Render` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Subtitle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimmedVideoId` to the `Trim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Trim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Render" ADD COLUMN     "renderedVideoId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Subtitle" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Trim" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "trimmedVideoId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
