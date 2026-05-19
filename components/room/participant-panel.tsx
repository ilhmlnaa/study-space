"use client";

import { Users } from "lucide-react";

import { UserAvatar } from "@/components/layout/user-avatar";
import { RoleBadge } from "@/components/layout/role-badge";
import type { Participant } from "@/hooks/use-participants";

type ParticipantPanelProps = {
  participants: Participant[];
};

export function ParticipantPanel({ participants }: ParticipantPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">
          {participants.length} Participant{participants.length !== 1 ? "s" : ""}{" "}
          Online
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
            {participants.map((participant) => (
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
