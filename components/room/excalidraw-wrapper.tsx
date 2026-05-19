"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import type { Socket } from "socket.io-client";

import { cn } from "@/lib/cn";

type ExcalidrawWrapperProps = {
  socket: Socket | null;
  roomId: string;
  initialElements: any[];
  canDraw: boolean;
  isReadOnly: boolean;
  isCreator: boolean;
};

export default function ExcalidrawWrapper({
  socket,
  roomId,
  initialElements,
  canDraw,
  isReadOnly,
  isCreator,
}: ExcalidrawWrapperProps) {
  const apiRef = useRef<any>(null);
  const isApplyingRemoteRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVersionRef = useRef<number>(-1);
  const lastSyncTimeRef = useRef<number>(0);

  const viewMode = isReadOnly || !canDraw;

  // Apply remote updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: { elements?: unknown[] }) => {
      if (!apiRef.current || !Array.isArray(data.elements)) return;
      isApplyingRemoteRef.current = true;
      apiRef.current.updateScene({ elements: data.elements });
      // Reset on next tick so the resulting onChange has been processed
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 0);
    };

    const handleCleared = () => {
      if (!apiRef.current) return;
      isApplyingRemoteRef.current = true;
      apiRef.current.updateScene({ elements: [] });
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 0);
    };

    socket.on("whiteboard:update", handleUpdate);
    socket.on("whiteboard:cleared", handleCleared);

    return () => {
      socket.off("whiteboard:update", handleUpdate);
      socket.off("whiteboard:cleared", handleCleared);
    };
  }, [socket]);

  // Compute a cheap scene version to detect real element changes only
  function computeSceneVersion(elements: readonly any[]): number {
    let version = elements.length * 31;
    for (const el of elements) {
      version += (el?.version ?? 0) + ((el?.versionNonce ?? 0) % 1_000_000);
    }
    return version;
  }

  function handleChange(elements: readonly any[], appState: any, files: any) {
    if (!socket) return;
    // Skip emits triggered by applying a remote update (prevents echo loop)
    if (isApplyingRemoteRef.current) return;

    // Skip non-meaningful changes (cursor moves, selection, etc.)
    const version = computeSceneVersion(elements);
    if (version === lastVersionRef.current) return;
    lastVersionRef.current = version;

    // Throttle realtime sync emits to avoid flooding the socket
    const now = Date.now();
    if (now - lastSyncTimeRef.current >= 50) {
      socket.emit("whiteboard:sync", { roomId, elements });
      lastSyncTimeRef.current = now;
    }

    // Debounced persistence to the database
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      socket.emit("whiteboard:save", { roomId, elements, appState, files });
    }, 2000);
  }

  function handleClear() {
    if (!socket) return;
    socket.emit("whiteboard:clear", { roomId });
    if (apiRef.current) {
      isApplyingRemoteRef.current = true;
      apiRef.current.updateScene({ elements: [] });
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 0);
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      {isCreator && !isReadOnly && (
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium",
              "bg-destructive/10 text-destructive hover:bg-destructive/20",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
            )}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear Whiteboard
          </button>
        </div>
      )}

      <div className="relative flex-1" style={{ minHeight: "400px" }}>
        <Excalidraw
          excalidrawAPI={(api) => {
            apiRef.current = api;
          }}
          initialData={{
            elements: initialElements,
            appState: {
              collaborators: new Map(),
            },
          }}
          viewModeEnabled={viewMode}
          onChange={handleChange}
        />

        {viewMode && (
          <div
            className={cn(
              "absolute top-4 left-1/2 -translate-x-1/2 z-50",
              "rounded-full bg-muted/90 px-3 py-1 text-xs font-medium text-muted-foreground",
              "border shadow-sm backdrop-blur-sm",
            )}
          >
            {isReadOnly ? "Read-only Mode" : "View Only"}
          </div>
        )}
      </div>
    </div>
  );
}
