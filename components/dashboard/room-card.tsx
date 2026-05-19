"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Copy, Check, Calendar, Pencil } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/layout/status-badge";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { AssignModeratorDialog } from "@/components/dashboard/assign-moderator-dialog";
import { EditRoomDialog } from "@/components/dashboard/edit-room-dialog";

type RoomData = {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  code: string;
  status: "ACTIVE" | "CLOSED";
  whiteboardPermission: "MENTOR_ONLY" | "MENTOR_MODERATOR" | "ALL_PARTICIPANTS";
  createdAt: string;
  _count: { participants: number };
};

type RoomCardProps = {
  room: RoomData;
};

export function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showAssignModerator, setShowAssignModerator] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  async function handleCloseRoom() {
    setIsClosing(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}/close`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        alert(data?.error ?? "Failed to close room.");
        return;
      }

      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsClosing(false);
    }
  }

  const createdDate = new Date(room.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{room.title}</CardTitle>
            <StatusBadge status={room.status} />
          </div>
          {room.topic ? (
            <p className="text-sm text-muted-foreground">{room.topic}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Room code */}
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
              {room.code}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
              aria-label="Copy room code"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden="true" />
              {room._count.participants}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {createdDate}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/room/${room.id}`}>
              <Button size="sm">Enter Room</Button>
            </Link>
            {room.status === "ACTIVE" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEdit(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : null}
            {room.status === "ACTIVE" ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowCloseConfirm(true)}
                disabled={isClosing}
              >
                Close Room
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAssignModerator(true)}
            >
              Assign Moderator
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showCloseConfirm}
        onOpenChange={setShowCloseConfirm}
        title="Close Room"
        description="Are you sure you want to close this room? Participants will no longer be able to interact in the room."
        confirmLabel="Close Room"
        variant="destructive"
        onConfirm={handleCloseRoom}
      />

      <AssignModeratorDialog
        roomId={room.id}
        open={showAssignModerator}
        onOpenChange={setShowAssignModerator}
      />

      <EditRoomDialog
        roomId={room.id}
        initialData={{
          title: room.title,
          description: room.description,
          topic: room.topic,
          whiteboardPermission: room.whiteboardPermission,
        }}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </>
  );
}
