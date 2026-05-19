"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
import type { Socket } from "socket.io-client";

import { cn } from "@/lib/cn";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => <WhiteboardSkeleton />,
  },
);

type ExcalidrawWhiteboardProps = {
  socket: Socket | null;
  roomId: string;
  initialData: {
    elements: unknown[];
    appState?: unknown;
    files?: unknown;
  } | null;
  canDraw: boolean;
  isReadOnly: boolean;
  isCreator: boolean;
};

type ExcalidrawApi = {
  updateScene: (data: { elements?: readonly any[] }) => void;
};

export function ExcalidrawWhiteboard({
  socket,
  roomId,
  initialData,
  canDraw,
  isReadOnly,
  isCreator,
}: ExcalidrawWhiteboardProps) {
  const [api, setApi] = useState<ExcalidrawApi | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build initialData ONCE - Excalidraw expects stable initialData reference.
  // Re-passing a new object on each render causes the canvas to re-initialize
  // and can crash with stale appState (e.g. plain-object collaborators).
  const initialPayload = useMemo(
    () => ({
      elements: Array.isArray(initialData?.elements)
        ? (initialData!.elements as readonly any[])
        : [],
      // appState is intentionally minimal. Any saved appState (zoom, scroll,
      // theme, collaborators) is volatile and tends to corrupt the canvas
      // when restored from JSON. Excalidraw will fill in safe defaults.
      appState: {
        collaborators: new Map(),
      },
      files:
        initialData?.files &&
        typeof initialData.files === "object" &&
        !Array.isArray(initialData.files)
          ? (initialData.files as Record<string, unknown>)
          : {},
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Realtime sync: listen for updates from other users and apply via the
  // imperative API instead of re-passing initialData (which would remount).
  useEffect(() => {
    if (!socket || !api) return;

    const handleUpdate = (data: { elements?: unknown[] }) => {
      if (Array.isArray(data.elements)) {
        api.updateScene({ elements: data.elements });
      }
    };

    const handleCleared = () => {
      api.updateScene({ elements: [] });
    };

    socket.on("whiteboard:update", handleUpdate);
    socket.on("whiteboard:cleared", handleCleared);

    return () => {
      socket.off("whiteboard:update", handleUpdate);
      socket.off("whiteboard:cleared", handleCleared);
    };
  }, [socket, api]);

  function handleChange(
    elements: readonly unknown[],
    appState: unknown,
    files: unknown,
  ) {
    if (!socket) return;

    // Sync immediately for realtime collaboration (lightweight payload).
    socket.emit("whiteboard:sync", { roomId, elements });

    // Debounced save to database (2 seconds after last change).
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      socket.emit("whiteboard:save", { roomId, elements, appState, files });
    }, 2000);
  }

  function handleClear() {
    if (!socket) return;
    socket.emit("whiteboard:clear", { roomId });
    if (api) api.updateScene({ elements: [] });
  }

  const viewMode = isReadOnly || !canDraw;

  return (
    <div className="relative flex flex-1 flex-col min-h-0">
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

      <div className="relative flex-1 min-h-0">
        <Excalidraw
          excalidrawAPI={(instance) => setApi(instance as ExcalidrawApi)}
          initialData={initialPayload as any}
          onChange={handleChange}
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

function WhiteboardSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-0">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
      </div>
    </div>
  );
}
