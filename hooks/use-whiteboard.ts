"use client";

import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

type WhiteboardData = {
  elements: any[];
  appState: any;
  files: any;
};

type UseWhiteboardOptions = {
  socket: Socket | null;
  roomId: string;
  initialData: WhiteboardData | null;
};

export function useWhiteboard({
  socket,
  roomId,
  initialData,
}: UseWhiteboardOptions) {
  const [elements, setElements] = useState<any[]>(initialData?.elements ?? []);
  const [appState, setAppState] = useState<any>(initialData?.appState ?? {});
  const [files, setFiles] = useState<any>(initialData?.files ?? null);

  // Set initial data on mount or when it changes
  useEffect(() => {
    if (initialData) {
      setElements(initialData.elements ?? []);
      setAppState(initialData.appState ?? {});
      setFiles(initialData.files ?? null);
    }
  }, [initialData]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: {
      elements?: any[];
      appState?: any;
      files?: any;
    }) => {
      if (data.elements) setElements(data.elements);
      if (data.appState) setAppState(data.appState);
      if (data.files) setFiles(data.files);
    };

    const handleCleared = () => {
      setElements([]);
      setAppState({});
      setFiles(null);
    };

    socket.on("whiteboard:update", handleUpdate);
    socket.on("whiteboard:cleared", handleCleared);

    return () => {
      socket.off("whiteboard:update", handleUpdate);
      socket.off("whiteboard:cleared", handleCleared);
    };
  }, [socket]);

  const syncWhiteboard = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (!socket) return;
      // Only send elements for realtime sync (appState/files are large and local)
      socket.emit("whiteboard:sync", { roomId, elements });
    },
    [socket, roomId],
  );

  const saveWhiteboard = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (!socket) return;
      socket.emit("whiteboard:save", { roomId, elements, appState, files });
    },
    [socket, roomId],
  );

  const clearWhiteboard = useCallback(() => {
    if (!socket) return;
    socket.emit("whiteboard:clear", { roomId });
  }, [socket, roomId]);

  return {
    elements,
    appState,
    files,
    setElements,
    setAppState,
    setFiles,
    syncWhiteboard,
    saveWhiteboard,
    clearWhiteboard,
  };
}
