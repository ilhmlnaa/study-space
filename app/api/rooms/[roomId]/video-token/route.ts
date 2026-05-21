import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLiveKitToken, getLiveKitPermissions } from "@/lib/livekit";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await context.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        status: true,
        roomMode: true,
        createdById: true,
        videoMaxParticipants: true,
        studentCanShareScreen: true,
        studentCanEnableCamera: true,
        studentCanEnableMic: true,
        participants: { select: { userId: true } },
        moderators: { select: { userId: true } },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    if (room.status !== "ACTIVE") {
      return NextResponse.json({ error: "Room is closed." }, { status: 400 });
    }

    if (room.roomMode !== "VIDEO_CONFERENCE") {
      return NextResponse.json(
        { error: "This room does not support video conference." },
        { status: 400 },
      );
    }

    const userId = session.user.id;
    const isCreator = room.createdById === userId;
    const isModerator = room.moderators.some((m) => m.userId === userId);
    const isParticipant = room.participants.some((p) => p.userId === userId);

    if (!isCreator && !isModerator && !isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant of this room." },
        { status: 403 },
      );
    }

    const role = isCreator ? "creator" : isModerator ? "moderator" : "student";

    let participantOverrides:
      | { canSpeak: boolean; canVideo: boolean }
      | undefined;
    if (role === "student") {
      const participant = await prisma.roomParticipant.findUnique({
        where: { roomId_userId: { roomId, userId } },
        select: { canSpeak: true, canVideo: true },
      });
      if (participant) {
        participantOverrides = {
          canSpeak: participant.canSpeak,
          canVideo: participant.canVideo,
        };
      }
    }

    const permissions = getLiveKitPermissions(
      role,
      {
        studentCanEnableCamera: room.studentCanEnableCamera,
        studentCanEnableMic: room.studentCanEnableMic,
        studentCanShareScreen: room.studentCanShareScreen,
      },
      participantOverrides,
    );

    const livekitRoomName = `studyspace-${room.id}`;

    const token = await generateLiveKitToken({
      roomName: livekitRoomName,
      participantIdentity: userId,
      participantName: session.user.name ?? "Anonymous",
      permissions,
      metadata: JSON.stringify({
        role,
        image: session.user.image ?? null,
      }),
    });

    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit server URL is not configured." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: livekitUrl, token });
  } catch (error) {
    console.error("[POST /api/rooms/[roomId]/video-token]", error);
    return NextResponse.json(
      { error: "Failed to generate video token." },
      { status: 500 },
    );
  }
}
