"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(roomId: string, userId: string): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const instance = io({
      path: "/api/socket",
      addTrailingSlash: false,
    });

    socketRef.current = instance;
    setSocket(instance);

    instance.on("connect", () => {
      instance.emit("room:join", { roomId, userId });
    });

    return () => {
      instance.emit("room:leave", { roomId, userId });
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [roomId, userId]);

  return socket;
}
