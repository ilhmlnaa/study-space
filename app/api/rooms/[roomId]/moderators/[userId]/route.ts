import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ roomId: string; userId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { roomId, userId } = await context.params;

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
        { error: "Only the room creator can remove moderators." },
        { status: 403 },
      );
    }

    const existing = await prisma.roomModerator.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Moderator assignment not found." },
        { status: 404 },
      );
    }

    await prisma.roomModerator.delete({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/rooms/[roomId]/moderators/[userId]]", error);
    return NextResponse.json(
      { error: "Failed to remove moderator." },
      { status: 500 },
    );
  }
}
