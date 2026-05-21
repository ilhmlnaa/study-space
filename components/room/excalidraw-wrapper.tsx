"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Socket } from "socket.io-client";

import { cn } from "@/lib/cn";

type ExcalidrawWrapperProps = {
  socket: Socket | null;
  roomId: string;
  initialElements: any[];
  initialFiles: Record<string, any>;
  canDraw: boolean;
  isReadOnly: boolean;
  isCreator: boolean;
};

export default function ExcalidrawWrapper({
  socket,
  roomId,
  initialElements,
  initialFiles,
  canDraw,
  isReadOnly,
  isCreator,
}: ExcalidrawWrapperProps) {
  const apiRef = useRef<any>(null);
  const [api, setApi] = useState<any>(null);
  const isApplyingRemoteRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVersionRef = useRef<number>(-1);
  const lastSyncedVersionRef = useRef<number>(-1);
  const lastSyncTimeRef = useRef<number>(0);
  const socketRef = useRef(socket);
  const roomIdRef = useRef(roomId);
  const sentFileIdsRef = useRef<Set<string>>(new Set());

  // Throttle interval in ms — higher value reduces server load in large rooms
  const SYNC_THROTTLE_MS = 300;
  const FINAL_SYNC_DELAY_MS = 350;

  // Pre-populate sent files cache with initial files so they aren't re-sent
  useEffect(() => {
    for (const fileId of Object.keys(initialFiles ?? {})) {
      sentFileIdsRef.current.add(fileId);
    }
  }, [initialFiles]);

  // Keep refs in sync without causing re-renders
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const viewMode = isReadOnly || !canDraw;

  function getNewFiles(files: Record<string, any> | null | undefined) {
    if (!files || typeof files !== "object") return undefined;

    const newFiles: Record<string, any> = {};
    for (const [fileId, file] of Object.entries(files)) {
      if (sentFileIdsRef.current.has(fileId)) continue;
      sentFileIdsRef.current.add(fileId);
      newFiles[fileId] = file;
    }

    return Object.keys(newFiles).length > 0 ? newFiles : undefined;
  }

  function emitWhiteboardSync(elements: readonly any[], files: any) {
    const sock = socketRef.current;
    const rid = roomIdRef.current;
    if (!sock) return;

    const newFiles = getNewFiles(files);
    sock.emit("whiteboard:sync", {
      roomId: rid,
      elements,
      ...(newFiles ? { files: newFiles } : {}),
    });
  }

  // Subscribe to remote whiteboard updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: {
      elements?: unknown[];
      files?: Record<string, any>;
    }) => {
      if (!apiRef.current || !Array.isArray(data.elements)) return;
      isApplyingRemoteRef.current = true;
      // Add any new files first so images render correctly
      if (data.files && Object.keys(data.files).length > 0) {
        apiRef.current.addFiles(Object.values(data.files));
      }
      apiRef.current.updateScene({ elements: data.elements });
      requestAnimationFrame(() => {
        isApplyingRemoteRef.current = false;
      });
    };

    const handleCleared = () => {
      if (!apiRef.current) return;
      isApplyingRemoteRef.current = true;
      apiRef.current.updateScene({ elements: [] });
      sentFileIdsRef.current.clear();
      requestAnimationFrame(() => {
        isApplyingRemoteRef.current = false;
      });
    };

    socket.on("whiteboard:update", handleUpdate);
    socket.on("whiteboard:cleared", handleCleared);

    return () => {
      socket.off("whiteboard:update", handleUpdate);
      socket.off("whiteboard:cleared", handleCleared);
    };
  }, [socket]);

  // Subscribe to Excalidraw changes via API (more reliable than onChange prop)
  useEffect(() => {
    if (!api) return;

    const unsubscribe = api.onChange(
      (elements: readonly any[], appState: any, files: any) => {
        if (isApplyingRemoteRef.current) return;

        // Version check - skip if nothing changed
        let version = elements.length * 31;
        for (const el of elements) {
          version += (el?.version ?? 0) + ((el?.versionNonce ?? 0) % 1_000_000);
        }
        if (version === lastVersionRef.current) return;
        lastVersionRef.current = version;

        // Only sync when gesture is complete (not mid-draw)
        const isDrawing =
          appState?.draggingElement != null ||
          appState?.resizingElement != null ||
          appState?.editingElement != null;

        if (!isDrawing) {
          const now = Date.now();
          if (now - lastSyncTimeRef.current >= SYNC_THROTTLE_MS) {
            emitWhiteboardSync(elements, files);
            lastSyncTimeRef.current = now;
            lastSyncedVersionRef.current = version;
          }
        }

        // Always schedule a final sync to catch the last state of a gesture
        // (e.g. resize completion that wasn't sent during isDrawing).
        if (finalSyncTimerRef.current) clearTimeout(finalSyncTimerRef.current);
        finalSyncTimerRef.current = setTimeout(() => {
          if (lastSyncedVersionRef.current !== lastVersionRef.current) {
            emitWhiteboardSync(elements, files);
            lastSyncedVersionRef.current = lastVersionRef.current;
            lastSyncTimeRef.current = Date.now();
          }
        }, FINAL_SYNC_DELAY_MS);

        // Debounced save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const sock = socketRef.current;
          const rid = roomIdRef.current;
          if (sock) {
            sock.emit("whiteboard:save", {
              roomId: rid,
              elements,
              appState,
              files,
            });
          }
        }, 2000);
      },
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [api]);

  function handleClear() {
    const sock = socketRef.current;
    const rid = roomIdRef.current;
    if (!sock) return;
    sock.emit("whiteboard:clear", { roomId: rid });
    sentFileIdsRef.current.clear();
    if (apiRef.current) {
      isApplyingRemoteRef.current = true;
      apiRef.current.updateScene({ elements: [] });
      requestAnimationFrame(() => {
        isApplyingRemoteRef.current = false;
      });
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
          excalidrawAPI={(instance) => {
            apiRef.current = instance;
            setApi(instance);
          }}
          initialData={{
            elements: initialElements,
            appState: {
              collaborators: new Map(),
            },
            files: initialFiles,
          }}
          viewModeEnabled={viewMode}
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
