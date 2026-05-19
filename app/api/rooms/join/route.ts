import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { joinRoomSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = joinRoomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request data.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const room = await prisma.room.findUnique({
      where: { code: parsed.data.code },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found." },
        { status: 404 },
      );
    }

    if (room.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This room is no longer active." },
        { status: 400 },
      );
    }

    const existing = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already a participant in this room." },
        { status: 409 },
      );
    }

    await prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rooms/join]", error);
    return NextResponse.json(
      { error: "Failed to join room." },
      { status: 500 },
    );
  }
}
