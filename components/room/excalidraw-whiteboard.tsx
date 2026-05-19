"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
import type { Socket } from "socket.io-client";

import { cn } from "@/lib/cn";

// Excalidraw must be loaded as a separate client component with CSS
const ExcalidrawWrapper = dynamic(() => import("./excalidraw-wrapper"), {
  ssr: false,
  loading: () => <WhiteboardSkeleton />,
});

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

export function ExcalidrawWhiteboard({
  socket,
  roomId,
  initialData,
  canDraw,
  isReadOnly,
  isCreator,
}: ExcalidrawWhiteboardProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const initialElements = useMemo(
    () => (Array.isArray(initialData?.elements) ? initialData!.elements : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Listen for realtime updates from other users
  useEffect(() => {
    if (!socket || !excalidrawAPI) return;

    const handleUpdate = (data: { elements?: unknown[] }) => {
      if (Array.isArray(data.elements)) {
        excalidrawAPI.updateScene({ elements: data.elements });
      }
    };

    const handleCleared = () => {
      excalidrawAPI.updateScene({ elements: [] });
    };

    socket.on("whiteboard:update", handleUpdate);
    socket.on("whiteboard:cleared", handleCleared);

    return () => {
      socket.off("whiteboard:update", handleUpdate);
      socket.off("whiteboard:cleared", handleCleared);
    };
  }, [socket, excalidrawAPI]);

  function handleChange(elements: readonly any[], appState: any, files: any) {
    if (!socket) return;

    // Sync immediately for realtime collaboration
    socket.emit("whiteboard:sync", { roomId, elements });

    // Debounced save to database
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
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({ elements: [] });
    }
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

      <div className="relative flex-1 min-h-0" style={{ minHeight: "400px" }}>
        <ExcalidrawWrapper
          initialElements={initialElements}
          viewModeEnabled={viewMode}
          onExcalidrawAPI={setExcalidrawAPI}
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

function WhiteboardSkeleton() {
  return (
    <div
      className="flex flex-1 items-center justify-center min-h-0"
      style={{ minHeight: "400px" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
      </div>
    </div>
  );
}
