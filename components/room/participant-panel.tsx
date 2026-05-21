"use client";

import { useState } from "react";
import { MicOff, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/layout/user-avatar";
import { RoleBadge } from "@/components/layout/role-badge";
import type { Participant } from "@/hooks/use-participants";

type ParticipantPanelProps = {
  participants: Participant[];
  roomId?: string;
  canModerate?: boolean;
  isVideoConference?: boolean;
  speakingUserIds?: string[];
};

export function ParticipantPanel({
  participants,
  roomId,
  canModerate = false,
  isVideoConference = false,
  speakingUserIds = [],
}: ParticipantPanelProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleRevokeSpeaking(userId: string) {
    if (!roomId) return;
    setRevokingId(userId);
    try {
      await fetch(`/api/rooms/${roomId}/speaking`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.error("Failed to revoke speaking:", err);
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">
          {participants.length} Participant
          {participants.length !== 1 ? "s" : ""} Online
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {participants.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No participants online.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {participants.map((participant) => {
              const canSpeak = speakingUserIds.includes(participant.id);
              const isStudent = participant.role === "STUDENT";
              const showRevokeButton =
                isVideoConference && canModerate && isStudent && canSpeak;

              return (
                <li
                  key={participant.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                >
                  <UserAvatar
                    name={participant.name}
                    image={participant.image}
                    size="sm"
                  />
                  <div className="flex flex-1 items-center gap-2 overflow-hidden">
                    <span className="truncate text-sm font-medium text-foreground">
                      {participant.name ?? "Anonymous"}
                    </span>
                    <RoleBadge
                      role={
                        participant.role as
                          | "ADMIN"
                          | "MENTOR"
                          | "MODERATOR"
                          | "STUDENT"
                      }
                    />
                    {isVideoConference && canSpeak && isStudent && (
                      <span className="shrink-0 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[9px] font-medium text-green-700 dark:text-green-400">
                        Speaking
                      </span>
                    )}
                  </div>
                  {showRevokeButton && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeSpeaking(participant.id)}
                      disabled={revokingId === participant.id}
                      aria-label={`Mute ${participant.name ?? "Anonymous"}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      title="Revoke speaking permission"
                    >
                      <MicOff className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
