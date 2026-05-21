"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, MonitorPlay, PenLine, Users, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/layout/status-badge";

type RoomHeaderProps = {
  room: {
    id: string;
    title: string;
    topic: string | null;
    code: string;
    status: "ACTIVE" | "CLOSED";
  };
  participantCount: number;
  isCreator: boolean;
  dashboardPath: string;
  onCloseRoom?: () => void;
  showViewToggle?: boolean;
  currentView?: "video" | "whiteboard";
  onToggleView?: () => void;
};

export function RoomHeader({
  room,
  participantCount,
  isCreator,
  dashboardPath,
  onCloseRoom,
  showViewToggle = false,
  currentView,
  onToggleView,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="flex items-center gap-2 sm:gap-3 border-b bg-card px-3 sm:px-4 py-3">
      <Link href={dashboardPath}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to dashboard"
          className="h-8 w-8 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      <div className="flex flex-1 items-center gap-2 sm:gap-3 overflow-hidden">
        <h1 className="truncate text-base sm:text-lg font-semibold text-foreground">
          {room.title}
        </h1>

        {room.topic && (
          <Badge variant="secondary" className="hidden md:inline-flex shrink-0">
            {room.topic}
          </Badge>
        )}

        <button
          onClick={handleCopyCode}
          className={cn(
            "flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-md border px-1.5 py-1 sm:px-2 sm:py-1 font-mono text-[10px] sm:text-xs transition-colors hover:bg-muted",
            copied && "border-green-500 text-green-600",
          )}
          title="Copy room code"
        >
          <span>{room.code}</span>
          <Copy className="h-3 w-3" />
        </button>

        <div className="hidden sm:block shrink-0">
          <StatusBadge status={room.status} />
        </div>

        <span className="flex shrink-0 items-center gap-1.5 text-xs sm:text-sm text-muted-foreground ml-auto sm:ml-0">
          <Users className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
          {participantCount}
        </span>
      </div>

      {room.status === "CLOSED" && (
        <Badge variant="secondary" className="hidden sm:inline-flex">
          Read-only
        </Badge>
      )}

      {showViewToggle && onToggleView && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleView}
          className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5"
          title={
            currentView === "video" ? "Switch to whiteboard" : "Switch to video"
          }
        >
          {currentView === "video" ? (
            <>
              <PenLine className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Whiteboard</span>
            </>
          ) : (
            <>
              <MonitorPlay className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Video</span>
            </>
          )}
        </Button>
      )}

      {isCreator && room.status === "ACTIVE" && onCloseRoom && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onCloseRoom}
          className="h-8 sm:h-9 px-2 sm:px-3"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Close Room</span>
        </Button>
      )}
    </header>
  );
}
