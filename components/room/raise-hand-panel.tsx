"use client";

import { useState } from "react";
import { Hand, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/layout/user-avatar";
import { RoleBadge } from "@/components/layout/role-badge";
import type { RaiseHand } from "@/hooks/use-raise-hand";

type RaiseHandPanelProps = {
  raiseHands: RaiseHand[];
  onRaiseHand: () => Promise<unknown>;
  onResolveHand: (raiseHandId: string) => Promise<unknown>;
  isReadOnly: boolean;
  currentUserId: string;
  canResolve: boolean;
  userHasActiveHand?: boolean;
};

export function RaiseHandPanel({
  raiseHands,
  onRaiseHand,
  onResolveHand,
  isReadOnly,
  currentUserId,
  canResolve,
  userHasActiveHand = false,
}: RaiseHandPanelProps) {
  const [isRaising, setIsRaising] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const unresolvedHands = raiseHands.filter((h) => !h.isResolved);

  async function handleRaiseHand() {
    setIsRaising(true);
    try {
      await onRaiseHand();
    } finally {
      setIsRaising(false);
    }
  }

  async function handleResolve(raiseHandId: string) {
    setResolvingId(raiseHandId);
    try {
      await onResolveHand(raiseHandId);
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Hand
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-foreground">
            Raised Hands
            {unresolvedHands.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unresolvedHands.length}
              </span>
            )}
          </span>
        </div>
        {!isReadOnly && !canResolve && (
          <Button
            size="sm"
            variant={userHasActiveHand ? "secondary" : "outline"}
            onClick={handleRaiseHand}
            disabled={isRaising || userHasActiveHand}
          >
            <Hand className="h-3.5 w-3.5" />
            {userHasActiveHand ? "Hand Raised" : "Raise Hand"}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {unresolvedHands.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No raised hands</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {unresolvedHands.map((hand) => (
              <li
                key={hand.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <UserAvatar
                  name={hand.user.name}
                  image={hand.user.image}
                  size="sm"
                />
                <div className="flex flex-1 items-center gap-2 overflow-hidden">
                  <span className="truncate text-sm font-medium text-foreground">
                    {hand.user.name ?? "Anonymous"}
                  </span>
                  <RoleBadge
                    role={
                      hand.user.role as
                        | "ADMIN"
                        | "MENTOR"
                        | "MODERATOR"
                        | "STUDENT"
                    }
                    className="scale-75"
                  />
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(hand.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {canResolve && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResolve(hand.id)}
                    disabled={resolvingId === hand.id}
                    aria-label={`Resolve hand raised by ${hand.user.name ?? "Anonymous"}`}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
