"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export type Announcement = {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
};

type UseAnnouncementsOptions = {
  socket: Socket | null;
  roomId: string;
  initialAnnouncements: Announcement[];
  onNewAnnouncement?: (announcement: Announcement) => void;
};

export function useAnnouncements({
  socket,
  roomId,
  initialAnnouncements,
  onNewAnnouncement,
}: UseAnnouncementsOptions) {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);
  const onNewAnnouncementRef = useRef(onNewAnnouncement);
  useEffect(() => {
    onNewAnnouncementRef.current = onNewAnnouncement;
  }, [onNewAnnouncement]);

  useEffect(() => {
    if (!socket) return;

    const handleNewAnnouncement = (data: { announcement: Announcement }) => {
      setAnnouncements((prev) => {
        if (prev.some((a) => a.id === data.announcement.id)) return prev;
        return [data.announcement, ...prev];
      });
      onNewAnnouncementRef.current?.(data.announcement);
    };

    socket.on("announcement:new", handleNewAnnouncement);

    return () => {
      socket.off("announcement:new", handleNewAnnouncement);
    };
  }, [socket]);

  async function sendAnnouncement(content: string) {
    const res = await fetch(`/api/rooms/${roomId}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      throw new Error("Failed to send announcement");
    }

    const announcement: Announcement = await res.json();

    setAnnouncements((prev) => {
      if (prev.some((a) => a.id === announcement.id)) return prev;
      return [announcement, ...prev];
    });

    if (socket) {
      socket.emit("announcement:send", { roomId, announcement });
    }

    return announcement;
  }

  return { announcements, sendAnnouncement };
}
