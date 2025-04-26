/*
  Warnings:

  - The primary key for the `Render` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Subtitle` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Trim` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Video` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Render` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `videoId` on the `Render` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `renderedVideoId` on the `Render` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Subtitle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `videoId` on the `Subtitle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Trim` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `videoId` on the `Trim` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `trimmedVideoId` on the `Trim` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Video` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Render" DROP CONSTRAINT "Render_videoId_fkey";

-- DropForeignKey
ALTER TABLE "Subtitle" DROP CONSTRAINT "Subtitle_videoId_fkey";

-- DropForeignKey
ALTER TABLE "Trim" DROP CONSTRAINT "Trim_videoId_fkey";

-- AlterTable
ALTER TABLE "Render" DROP CONSTRAINT "Render_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "videoId",
ADD COLUMN     "videoId" UUID NOT NULL,
DROP COLUMN "renderedVideoId",
ADD COLUMN     "renderedVideoId" UUID NOT NULL,
ADD CONSTRAINT "Render_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Subtitle" DROP CONSTRAINT "Subtitle_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "videoId",
ADD COLUMN     "videoId" UUID NOT NULL,
ADD CONSTRAINT "Subtitle_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Trim" DROP CONSTRAINT "Trim_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "videoId",
ADD COLUMN     "videoId" UUID NOT NULL,
DROP COLUMN "trimmedVideoId",
ADD COLUMN     "trimmedVideoId" UUID NOT NULL,
ADD CONSTRAINT "Trim_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Video" DROP CONSTRAINT "Video_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Video_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Trim" ADD CONSTRAINT "Trim_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtitle" ADD CONSTRAINT "Subtitle_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Render" ADD CONSTRAINT "Render_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
