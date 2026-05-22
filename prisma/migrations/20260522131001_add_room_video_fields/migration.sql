-- CreateEnum
CREATE TYPE "RoomMode" AS ENUM ('WHITEBOARD_ONLY', 'VIDEO_CONFERENCE');

-- CreateEnum
CREATE TYPE "VideoMode" AS ENUM ('LECTURE', 'DISCUSSION');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "maxActiveCameras" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "roomMode" "RoomMode" NOT NULL DEFAULT 'WHITEBOARD_ONLY',
ADD COLUMN     "studentCanEnableCamera" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentCanEnableMic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentCanShareScreen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoMaxParticipants" INTEGER,
ADD COLUMN     "videoMode" "VideoMode" NOT NULL DEFAULT 'LECTURE';

-- AlterTable
ALTER TABLE "RoomParticipant" ADD COLUMN     "canSpeak" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canVideo" BOOLEAN NOT NULL DEFAULT false;
