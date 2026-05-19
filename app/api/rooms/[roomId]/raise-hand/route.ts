import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;

    const raiseHands = await prisma.raiseHand.findMany({
      where: { roomId },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(raiseHands);
  } catch (err) {
    console.error("[GET /api/rooms/[roomId]/raise-hand]", err);
    return NextResponse.json(
      { error: "Failed to fetch raise hands." },
      { status: 500 },
    );
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    if (room.status !== "ACTIVE") {
      return NextResponse.json({ error: "Room is closed." }, { status: 403 });
    }

    const participant = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: session.user.id } },
    });
    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant of this room." },
        { status: 403 },
      );
    }

    const raiseHand = await prisma.raiseHand.create({
      data: { roomId, userId: session.user.id },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    return NextResponse.json(raiseHand, { status: 201 });
  } catch (err) {
    console.error("[POST /api/rooms/[roomId]/raise-hand]", err);
    return NextResponse.json(
      { error: "Failed to raise hand." },
      { status: 500 },
    );
  }
}
