"use client";

import { useEffect, useRef, useState } from "react";
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
  onNewMessage?: (message: ChatMessage) => void;
};

export function useChat({
  socket,
  roomId,
  userId,
  initialMessages,
  onNewMessage,
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { message: ChatMessage }) => {
      setMessages((prev) => [...prev, data.message].slice(-300));
      onNewMessageRef.current?.(data.message);
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    };

    socket.on("chat:new", handleNewMessage);
    socket.on("chat:error", handleError);

    return () => {
      socket.off("chat:new", handleNewMessage);
      socket.off("chat:error", handleError);
    };
  }, [socket]);

  function sendMessage(content: string) {
    if (!socket || !content.trim()) return;
    socket.emit("chat:send", { roomId, userId, message: content });
  }

  return { messages, sendMessage, error };
}
