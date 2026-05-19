import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAnnouncementSchema } from "@/lib/validations";

const userSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
} as const;

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

    const announcements = await prisma.announcement.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: userSelect } },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("[GET /api/rooms/[roomId]/announcements]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
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

    const isMentor = session.user.role === "MENTOR" && room.createdById === session.user.id;
    const isModerator = await prisma.roomModerator.findUnique({
      where: { roomId_userId: { roomId, userId: session.user.id } },
    });

    if (!isMentor && !isModerator) {
      return NextResponse.json(
        { error: "Only the room mentor or moderators can create announcements" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = createAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        roomId,
        userId: session.user.id,
        content: parsed.data.content,
      },
      include: { user: { select: userSelect } },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rooms/[roomId]/announcements]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
