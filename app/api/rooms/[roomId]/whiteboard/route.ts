import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const snapshot = await prisma.whiteboardSnapshot.findUnique({
      where: { roomId },
    });

    if (!snapshot) {
      return NextResponse.json({ id: null, roomId, data: { elements: [] }, createdAt: null, updatedAt: null });
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[GET /api/rooms/[roomId]/whiteboard]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (room.status !== "ACTIVE") {
      return NextResponse.json({ error: "Room is not active" }, { status: 403 });
    }

    // Check whiteboard permission based on room setting and user role
    const hasPermission = await checkWhiteboardPermission(
      room.whiteboardPermission,
      room.createdById,
      roomId,
      session.user.id,
      session.user.role,
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You do not have permission to edit the whiteboard" },
        { status: 403 },
      );
    }

    const body = await req.json();
    if (!body.elements || !Array.isArray(body.elements)) {
      return NextResponse.json(
        { error: "Validation failed: elements array is required" },
        { status: 422 },
      );
    }

    const snapshot = await prisma.whiteboardSnapshot.upsert({
      where: { roomId },
      create: {
        roomId,
        data: { elements: body.elements },
      },
      update: {
        data: { elements: body.elements },
      },
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[PUT /api/rooms/[roomId]/whiteboard]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function checkWhiteboardPermission(
  permission: string,
  roomCreatorId: string,
  roomId: string,
  userId: string,
  userRole: string,
): Promise<boolean> {
  switch (permission) {
    case "MENTOR_ONLY":
      return userRole === "MENTOR" && roomCreatorId === userId;

    case "MENTOR_MODERATOR": {
      if (userRole === "MENTOR" && roomCreatorId === userId) return true;
      const moderator = await prisma.roomModerator.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      return !!moderator;
    }

    case "ALL_PARTICIPANTS": {
      const participant = await prisma.roomParticipant.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      return !!participant;
    }

    default:
      return false;
  }
}
