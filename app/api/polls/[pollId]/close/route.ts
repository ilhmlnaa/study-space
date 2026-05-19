import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pollId } = await params;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { room: true },
    });
    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }
    if (!poll.isActive) {
      return NextResponse.json({ error: "Poll is already closed" }, { status: 400 });
    }

    // Check if user is MENTOR (room creator) or MODERATOR of the room
    const isMentor =
      session.user.role === "MENTOR" && poll.room.createdById === session.user.id;

    const isModerator = await prisma.roomModerator.findUnique({
      where: { roomId_userId: { roomId: poll.roomId, userId: session.user.id } },
    });

    if (!isMentor && !isModerator) {
      return NextResponse.json(
        { error: "Only the room mentor or moderators can close polls" },
        { status: 403 },
      );
    }

    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        isActive: false,
        closedAt: new Date(),
      },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } },
          },
        },
      },
    });

    const result = {
      id: updatedPoll.id,
      roomId: updatedPoll.roomId,
      question: updatedPoll.question,
      isActive: updatedPoll.isActive,
      createdAt: updatedPoll.createdAt,
      closedAt: updatedPoll.closedAt,
      options: updatedPoll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt._count.votes,
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PATCH /api/polls/[pollId]/close]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
