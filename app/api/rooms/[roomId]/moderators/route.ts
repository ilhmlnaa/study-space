import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { roomId } = await context.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, createdById: true },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found." },
        { status: 404 },
      );
    }

    if (room.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "Only the room creator can assign moderators." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { userId?: unknown };
    const userId = typeof body.userId === "string" ? body.userId : "";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, email: true, image: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    if (targetUser.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Target user must have the MODERATOR role." },
        { status: 400 },
      );
    }

    const existingModerator = await prisma.roomModerator.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (existingModerator) {
      return NextResponse.json(
        { error: "User is already a moderator in this room." },
        { status: 409 },
      );
    }

    const moderator = await prisma.roomModerator.create({
      data: {
        roomId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // Add as participant if not already.
    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!existingParticipant) {
      await prisma.roomParticipant.create({
        data: {
          roomId,
          userId,
        },
      });
    }

    return NextResponse.json({ moderator }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rooms/[roomId]/moderators]", error);
    return NextResponse.json(
      { error: "Failed to add moderator." },
      { status: 500 },
    );
  }
}
