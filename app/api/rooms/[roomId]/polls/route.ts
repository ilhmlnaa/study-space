import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPollSchema } from "@/lib/validations";

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

    const polls = await prisma.poll.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } },
          },
        },
        votes: {
          where: { userId: session.user.id },
          select: { optionId: true },
        },
      },
    });

    const result = polls.map((poll) => ({
      id: poll.id,
      roomId: poll.roomId,
      question: poll.question,
      isActive: poll.isActive,
      createdAt: poll.createdAt,
      closedAt: poll.closedAt,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt._count.votes,
      })),
      userVotedOptionId: poll.votes[0]?.optionId ?? null,
      hasVoted: poll.votes.length > 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/rooms/[roomId]/polls]", error);
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

    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can create polls" },
        { status: 403 },
      );
    }

    const { roomId } = await params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (room.status !== "ACTIVE") {
      return NextResponse.json({ error: "Room is not active" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createPollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const poll = await prisma.poll.create({
      data: {
        roomId,
        question: parsed.data.question,
        options: {
          create: parsed.data.options.map((text) => ({ text })),
        },
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
      id: poll.id,
      roomId: poll.roomId,
      question: poll.question,
      isActive: poll.isActive,
      createdAt: poll.createdAt,
      closedAt: poll.closedAt,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt._count.votes,
      })),
      userVotedOptionId: null,
      hasVoted: false,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rooms/[roomId]/polls]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
