import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import { RoomServiceClient } from "livekit-server-sdk";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

function getLiveKitClient(): RoomServiceClient | null {
  const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!host || !apiKey || !apiSecret) return null;

  // RoomServiceClient needs http(s) URL, convert ws(s) to http(s)
  const httpHost = host.replace(/^ws/, "http");
  return new RoomServiceClient(httpHost, apiKey, apiSecret);
}

export async function POST(request: Request, context: RouteContext) {
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

    const isCreator = room.createdById === session.user.id;
    const isModerator = room.moderators.some(
      (m) => m.userId === session.user.id,
    );

    if (!isCreator && !isModerator) {
      return NextResponse.json(
        { error: "Only the room creator or moderator can grant speaking permission." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, canSpeak = true, canVideo = false } = body as {
      userId: string;
      canSpeak?: boolean;
      canVideo?: boolean;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 },
      );
    }

    const participant = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "User is not a participant of this room." },
        { status: 404 },
      );
    }

    const updated = await prisma.roomParticipant.update({
      where: { roomId_userId: { roomId, userId } },
      data: { canSpeak, canVideo },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    // Update LiveKit participant permissions if connected
    const livekitClient = getLiveKitClient();
    if (livekitClient) {
      const livekitRoomName = `studyspace-${roomId}`;
      try {
        await livekitClient.updateParticipant(livekitRoomName, userId, undefined, {
          canPublish: canSpeak || canVideo,
          canSubscribe: true,
          canPublishData: true,
        });
      } catch (err) {
        // Participant might not be connected yet, that's okay
        console.warn("[Speaking] Failed to update LiveKit participant:", err);
      }
    }

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(roomId).emit("speaking:granted", { userId, canSpeak, canVideo });
    }

    return NextResponse.json({ participant: updated });
  } catch (error) {
    console.error("[POST /api/rooms/[roomId]/speaking]", error);
    return NextResponse.json(
      { error: "Failed to grant speaking permission." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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
        moderators: { select: { userId: true } },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    const isCreator = room.createdById === session.user.id;
    const isModerator = room.moderators.some(
      (m) => m.userId === session.user.id,
    );

    if (!isCreator && !isModerator) {
      return NextResponse.json(
        { error: "Only the room creator or moderator can revoke speaking permission." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 },
      );
    }

    await prisma.roomParticipant.update({
      where: { roomId_userId: { roomId, userId } },
      data: { canSpeak: false, canVideo: false },
    });

    // Update LiveKit participant permissions and mute
    const livekitClient = getLiveKitClient();
    if (livekitClient) {
      const livekitRoomName = `studyspace-${roomId}`;
      try {
        // Revoke publish permission
        await livekitClient.updateParticipant(livekitRoomName, userId, undefined, {
          canPublish: false,
          canSubscribe: true,
          canPublishData: true,
        });

        // Mute all tracks
        const participantInfo = await livekitClient.getParticipant(
          livekitRoomName,
          userId,
        );
        if (participantInfo?.tracks) {
          for (const track of participantInfo.tracks) {
            if (track.sid) {
              await livekitClient.mutePublishedTrack(
                livekitRoomName,
                userId,
                track.sid,
                true,
              );
            }
          }
        }
      } catch (err) {
        console.warn("[Speaking] Failed to update LiveKit participant:", err);
      }
    }

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(roomId).emit("speaking:revoked", { userId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/rooms/[roomId]/speaking]", error);
    return NextResponse.json(
      { error: "Failed to revoke speaking permission." },
      { status: 500 },
    );
  }
}
