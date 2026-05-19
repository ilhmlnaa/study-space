"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { Socket } from "socket.io-client";

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
  const initialElements = useMemo(
    () =>
      Array.isArray(initialData?.elements)
        ? (initialData!.elements as any[])
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const initialFiles = useMemo(
    () =>
      initialData?.files &&
      typeof initialData.files === "object" &&
      !Array.isArray(initialData.files)
        ? (initialData.files as Record<string, any>)
        : {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="flex flex-1 min-h-0">
      <ExcalidrawWrapper
        socket={socket}
        roomId={roomId}
        initialElements={initialElements}
        initialFiles={initialFiles}
        canDraw={canDraw}
        isReadOnly={isReadOnly}
        isCreator={isCreator}
      />
    </div>
  );
}

function WhiteboardSkeleton() {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      style={{ minHeight: "400px" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
      </div>
    </div>
  );
}
