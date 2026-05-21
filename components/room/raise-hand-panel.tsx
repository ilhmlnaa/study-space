"use client";

import { useState } from "react";
import { Hand, Mic, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/layout/user-avatar";
import { RoleBadge } from "@/components/layout/role-badge";
import type { RaiseHand } from "@/hooks/use-raise-hand";

type RaiseHandPanelProps = {
  raiseHands: RaiseHand[];
  onRaiseHand: () => Promise<unknown>;
  onResolveHand: (raiseHandId: string) => Promise<unknown>;
  onApproveHand?: (raiseHand: RaiseHand) => Promise<unknown>;
  isReadOnly: boolean;
  currentUserId: string;
  canResolve: boolean;
  isVideoConference?: boolean;
  userHasActiveHand?: boolean;
};

export function RaiseHandPanel({
  raiseHands,
  onRaiseHand,
  onResolveHand,
  onApproveHand,
  isReadOnly,
  currentUserId,
  canResolve,
  isVideoConference = false,
  userHasActiveHand = false,
}: RaiseHandPanelProps) {
  const [isRaising, setIsRaising] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const unresolvedHands = raiseHands.filter((h) => !h.isResolved);
  const myActiveHand = unresolvedHands.find((h) => h.userId === currentUserId);

  async function handleRaiseHand() {
    setIsRaising(true);
    try {
      await onRaiseHand();
    } finally {
      setIsRaising(false);
    }
  }

  async function handleLowerOwnHand() {
    if (!myActiveHand) return;
    setIsRaising(true);
    try {
      await onResolveHand(myActiveHand.id);
    } finally {
      setIsRaising(false);
    }
  }

  async function handleDismiss(raiseHandId: string) {
    setPendingId(raiseHandId);
    try {
      await onResolveHand(raiseHandId);
    } finally {
      setPendingId(null);
    }
  }

  async function handleApprove(hand: RaiseHand) {
    if (!onApproveHand) return;
    setPendingId(hand.id);
    try {
      await onApproveHand(hand);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
            onClick={userHasActiveHand ? handleLowerOwnHand : handleRaiseHand}
            disabled={isRaising}
          >
            <Hand className="h-3.5 w-3.5" />
            {userHasActiveHand ? "Lower Hand" : "Raise Hand"}
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
                className="flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
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
                </div>

                {canResolve && (
                  <div className="flex gap-2">
                    {isVideoConference && onApproveHand && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(hand)}
                        disabled={pendingId === hand.id}
                        className="flex-1 gap-1.5"
                      >
                        <Mic className="h-3.5 w-3.5" />
                        Allow to Speak
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismiss(hand.id)}
                      disabled={pendingId === hand.id}
                      className={
                        isVideoConference ? "gap-1.5" : "flex-1 gap-1.5"
                      }
                      aria-label={`Dismiss hand from ${hand.user.name ?? "Anonymous"}`}
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
