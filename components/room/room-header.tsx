"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Users, X } from "lucide-react";

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
};

export function RoomHeader({
  room,
  participantCount,
  isCreator,
  dashboardPath,
  onCloseRoom,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
      <Link href={dashboardPath}>
        <Button variant="ghost" size="icon" aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      <div className="flex flex-1 items-center gap-3 overflow-hidden">
        <h1 className="truncate text-lg font-semibold text-foreground">
          {room.title}
        </h1>

        {room.topic && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {room.topic}
          </Badge>
        )}

        <button
          onClick={handleCopyCode}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs transition-colors hover:bg-muted",
            copied && "border-green-500 text-green-600",
          )}
          title="Copy room code"
        >
          {room.code}
          <Copy className="h-3 w-3" />
        </button>

        <StatusBadge status={room.status} />

        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" aria-hidden="true" />
          {participantCount}
        </span>
      </div>

      {room.status === "CLOSED" && (
        <Badge variant="secondary">Read-only Mode</Badge>
      )}

      {isCreator && room.status === "ACTIVE" && onCloseRoom && (
        <Button variant="destructive" size="sm" onClick={onCloseRoom}>
          <X className="h-4 w-4" />
          Close Room
        </Button>
      )}
    </header>
  );
}
