import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const raiseHand = await prisma.raiseHand.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!raiseHand) {
      return NextResponse.json(
        { error: "Raise hand not found." },
        { status: 404 },
      );
    }

    const isCreator = raiseHand.room.createdById === session.user.id;
    const moderator = await prisma.roomModerator.findUnique({
      where: {
        roomId_userId: { roomId: raiseHand.roomId, userId: session.user.id },
      },
    });

    if (!isCreator && !moderator) {
      return NextResponse.json(
        { error: "You are not allowed to resolve this raise hand." },
        { status: 403 },
      );
    }

    const updated = await prisma.raiseHand.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/raise-hand/[id]]", err);
    return NextResponse.json(
      { error: "Failed to resolve raise hand." },
      { status: 500 },
    );
  }
}
