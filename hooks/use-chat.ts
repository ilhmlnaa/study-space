"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
};

type UseChatOptions = {
  socket: Socket | null;
  roomId: string;
  userId: string;
  initialMessages: ChatMessage[];
};

export function useChat({
  socket,
  roomId,
  userId,
  initialMessages,
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { message: ChatMessage }) => {
      setMessages((prev) => [...prev, data.message]);
    };

    socket.on("chat:new", handleNewMessage);

    return () => {
      socket.off("chat:new", handleNewMessage);
    };
  }, [socket]);

  function sendMessage(content: string) {
    if (!socket || !content.trim()) return;
    socket.emit("chat:send", { roomId, userId, message: content });
  }

  return { messages, sendMessage };
}
