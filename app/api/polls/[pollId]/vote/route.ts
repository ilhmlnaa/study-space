import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { votePollSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
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
      return NextResponse.json({ error: "Poll is no longer active" }, { status: 403 });
    }

    // Check user is a participant of the room
    const participant = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId: poll.roomId, userId: session.user.id } },
    });
    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant of this room" },
        { status: 403 },
      );
    }

    // Check user hasn't already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId: session.user.id } },
    });
    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this poll" },
        { status: 409 },
      );
    }

    const body = await req.json();
    const parsed = votePollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    // Verify the option belongs to this poll
    const option = await prisma.pollOption.findFirst({
      where: { id: parsed.data.optionId, pollId },
    });
    if (!option) {
      return NextResponse.json(
        { error: "Invalid option for this poll" },
        { status: 400 },
      );
    }

    await prisma.pollVote.create({
      data: {
        pollId,
        optionId: parsed.data.optionId,
        userId: session.user.id,
      },
    });

    // Return updated poll results
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } },
          },
        },
      },
    });

    const result = {
      id: updatedPoll!.id,
      roomId: updatedPoll!.roomId,
      question: updatedPoll!.question,
      isActive: updatedPoll!.isActive,
      createdAt: updatedPoll!.createdAt,
      closedAt: updatedPoll!.closedAt,
      options: updatedPoll!.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt._count.votes,
      })),
      userVotedOptionId: parsed.data.optionId,
      hasVoted: true,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/polls/[pollId]/vote]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
