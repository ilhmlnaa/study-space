import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRoomSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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
        participants: {
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
        },
        moderators: {
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

    return NextResponse.json({ room });
  } catch (error) {
    console.error("[GET /api/rooms/[roomId]]", error);
    return NextResponse.json(
      { error: "Failed to fetch room." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

    if (
      session.user.role !== "MENTOR" ||
      room.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Only the room creator can update this room." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = updateRoomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request data.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: parsed.data,
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

    return NextResponse.json({ room: updated });
  } catch (error) {
    console.error("[PATCH /api/rooms/[roomId]]", error);
    return NextResponse.json(
      { error: "Failed to update room." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    const isAdmin = session.user.role === "ADMIN";
    const isCreator = room.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Only an admin or the room creator can delete this room." },
        { status: 403 },
      );
    }

    await prisma.room.delete({ where: { id: roomId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/rooms/[roomId]]", error);
    return NextResponse.json(
      { error: "Failed to delete room." },
      { status: 500 },
    );
  }
}
