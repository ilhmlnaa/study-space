import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
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
      select: { id: true, createdById: true, status: true },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found." },
        { status: 404 },
      );
    }

    if (
      session.user.role !== "MENTOR" ||
      room.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Only the room creator can close this room." },
        { status: 403 },
      );
    }

    if (room.status === "CLOSED") {
      return NextResponse.json(
        { error: "This room is already closed." },
        { status: 400 },
      );
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    return NextResponse.json({ room: updated });
  } catch (error) {
    console.error("[PATCH /api/rooms/[roomId]/close]", error);
    return NextResponse.json(
      { error: "Failed to close room." },
      { status: 500 },
    );
  }
}
