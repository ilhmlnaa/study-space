"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export type Participant = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
};

type UseParticipantsOptions = {
  socket: Socket | null;
  initialParticipants: Participant[];
};

export function useParticipants({
  socket,
  initialParticipants,
}: UseParticipantsOptions) {
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);

  useEffect(() => {
    if (!socket) return;

    const handleParticipants = (data: { participants: Participant[] }) => {
      setParticipants(data.participants);
    };

    const handleUserJoined = (data: { user: Participant }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.id === data.user.id)) return prev;
        return [...prev, data.user];
      });
    };

    const handleUserLeft = (data: { userId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== data.userId));
    };

    socket.on("room:participants", handleParticipants);
    socket.on("room:user_joined", handleUserJoined);
    socket.on("room:user_left", handleUserLeft);

    return () => {
      socket.off("room:participants", handleParticipants);
      socket.off("room:user_joined", handleUserJoined);
      socket.off("room:user_left", handleUserLeft);
    };
  }, [socket]);

  return { participants };
}
