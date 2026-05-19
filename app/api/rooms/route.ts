import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRoomSchema } from "@/lib/validations";

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "STUDY-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: userId, role } = session.user;

    const baseInclude = {
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
    } as const;

    if (role === "ADMIN") {
      const rooms = await prisma.room.findMany({
        include: baseInclude,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ rooms });
    }

    if (role === "MENTOR") {
      const rooms = await prisma.room.findMany({
        where: { createdById: userId },
        include: baseInclude,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ rooms });
    }

    if (role === "MODERATOR") {
      const rooms = await prisma.room.findMany({
        where: {
          moderators: {
            some: { userId },
          },
        },
        include: baseInclude,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ rooms });
    }

    const rooms = await prisma.room.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: baseInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("[GET /api/rooms]", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can create rooms." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createRoomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request data.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Generate a unique room code, retrying on the unlikely event of a collision.
    let code = generateRoomCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) break;
      code = generateRoomCode();
    }

    const room = await prisma.room.create({
      data: {
        ...parsed.data,
        code,
        createdById: session.user.id,
        participants: {
          create: {
            userId: session.user.id,
          },
        },
      },
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

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rooms]", error);
    return NextResponse.json(
      { error: "Failed to create room." },
      { status: 500 },
    );
  }
}
