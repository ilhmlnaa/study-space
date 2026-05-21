import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoomClient } from "../../../components/room/room-client";

type RoomPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { roomId } = await params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      createdBy: true,
      participants: { include: { user: true } },
      moderators: { include: { user: true } },
      messages: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      polls: {
        include: {
          options: { include: { votes: true } },
          votes: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      announcements: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      raiseHands: {
        include: { user: true },
        where: { isResolved: false },
      },
      whiteboard: true,
    },
  });

  if (!room) {
    redirect("/student");
  }

  // Reverse messages so oldest is first for chat display
  room.messages = room.messages.reverse();

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const isCreator = room.createdById === userId;
  const isParticipant = room.participants.some((p) => p.userId === userId);
  const isModerator = room.moderators.some((m) => m.userId === userId);

  if (!isAdmin && !isCreator && !isParticipant && !isModerator) {
    redirect("/student");
  }

  return (
    <RoomClient
      room={room}
      currentUser={{
        id: session.user.id,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        role: session.user.role,
      }}
    />
  );
}
