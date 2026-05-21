"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

export function useSocket(roomId: string, userId: string): {
  socket: Socket | null;
  status: SocketStatus;
} {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const instance = io({
      path: "/api/socket",
      addTrailingSlash: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = instance;
    setSocket(instance);
    setStatus("connecting");

    instance.on("connect", () => {
      setStatus("connected");
      instance.emit("room:join", { roomId, userId });
    });

    instance.on("disconnect", () => {
      setStatus("disconnected");
    });

    instance.on("connect_error", () => {
      setStatus("error");
    });

    // Re-join room after reconnect to restore server-side state
    instance.on("reconnect", () => {
      setStatus("connected");
      instance.emit("room:join", { roomId, userId });
    });

    return () => {
      instance.emit("room:leave", { roomId, userId });
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setStatus("disconnected");
    };
  }, [roomId, userId]);

  return { socket, status };
}
