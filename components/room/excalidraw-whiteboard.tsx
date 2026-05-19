"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
import type { Socket } from "socket.io-client";

import { cn } from "@/lib/cn";
import { useWhiteboard } from "@/hooks/use-whiteboard";

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
  initialData: { elements: any[]; appState?: any; files?: any } | null;
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

  const {
    elements,
    appState,
    files,
    syncWhiteboard,
    saveWhiteboard,
    clearWhiteboard,
  } = useWhiteboard({
    socket,
    roomId,
    initialData: initialData
      ? {
          elements: initialData.elements,
          appState: initialData.appState ?? {},
          files: initialData.files ?? null,
        }
      : null,
  });

  function handleChange(
    updatedElements: readonly any[],
    updatedAppState: any,
    updatedFiles: any,
  ) {
    // Sync immediately for realtime collaboration
    syncWhiteboard(updatedElements, updatedAppState, updatedFiles);

    // Debounced save to database (2 seconds after last change)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveWhiteboard(updatedElements, updatedAppState, updatedFiles);
    }, 2000);
  }

  function handleClear() {
    clearWhiteboard();
  }

  const viewMode = isReadOnly || !canDraw;

  return (
    <div className="relative flex flex-1 flex-col min-h-0">
      {/* Toolbar */}
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

      {/* Excalidraw container */}
      <div className="relative flex-1 min-h-0">
        <Excalidraw
          initialData={{
            elements,
            appState,
            files,
          }}
          onChange={handleChange}
          viewModeEnabled={viewMode}
        />

        {/* Read-only overlay badge */}
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
