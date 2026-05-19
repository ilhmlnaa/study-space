"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export type RaiseHand = {
  id: string;
  roomId: string;
  userId: string;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
};

type UseRaiseHandOptions = {
  socket: Socket | null;
  roomId: string;
  initialRaiseHands: RaiseHand[];
  currentUserId: string;
};

export function useRaiseHand({
  socket,
  roomId,
  initialRaiseHands,
  currentUserId,
}: UseRaiseHandOptions) {
  const [raiseHands, setRaiseHands] = useState<RaiseHand[]>(initialRaiseHands);

  useEffect(() => {
    if (!socket) return;

    const handleHandRaised = (data: { raiseHand: RaiseHand }) => {
      setRaiseHands((prev) => {
        if (prev.some((h) => h.id === data.raiseHand.id)) return prev;
        return [data.raiseHand, ...prev];
      });
    };

    const handleHandResolved = (data: { raiseHandId: string }) => {
      setRaiseHands((prev) => prev.filter((h) => h.id !== data.raiseHandId));
    };

    socket.on("hand:raised", handleHandRaised);
    socket.on("hand:resolved", handleHandResolved);

    return () => {
      socket.off("hand:raised", handleHandRaised);
      socket.off("hand:resolved", handleHandResolved);
    };
  }, [socket]);

  async function raiseHand() {
    const res = await fetch(`/api/rooms/${roomId}/raise-hand`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Failed to raise hand");
    }

    const newRaiseHand: RaiseHand = await res.json();

    setRaiseHands((prev) => {
      if (prev.some((h) => h.id === newRaiseHand.id)) return prev;
      return [newRaiseHand, ...prev];
    });

    if (socket) {
      socket.emit("hand:raise", { roomId, raiseHand: newRaiseHand });
    }

    return newRaiseHand;
  }

  async function resolveHand(raiseHandId: string) {
    const res = await fetch(`/api/raise-hand/${raiseHandId}`, {
      method: "PATCH",
    });

    if (!res.ok) {
      throw new Error("Failed to resolve hand");
    }

    setRaiseHands((prev) => prev.filter((h) => h.id !== raiseHandId));

    if (socket) {
      socket.emit("hand:resolve", { roomId, raiseHandId });
    }
  }

  const userHasActiveHand = raiseHands.some(
    (h) => h.userId === currentUserId && !h.isResolved,
  );

  return { raiseHands, raiseHand, resolveHand, userHasActiveHand };
}
