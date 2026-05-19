"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleBadge } from "@/components/layout/role-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FoundUser = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "MENTOR" | "MODERATOR" | "STUDENT";
};

type AssignModeratorDialogProps = {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssignModeratorDialog({
  roomId,
  open,
  onOpenChange,
}: AssignModeratorDialogProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetState() {
    setEmail("");
    setFoundUser(null);
    setError(null);
    setSuccess(null);
    setIsSearching(false);
    setIsAssigning(false);
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      resetState();
    }
    onOpenChange(value);
  }

  async function handleSearch() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter an email address.");
      return;
    }

    setError(null);
    setSuccess(null);
    setFoundUser(null);
    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/users?role=MODERATOR&search=${encodeURIComponent(trimmed)}`,
      );

      if (!response.ok) {
        setError("Failed to search users.");
        return;
      }

      const users = (await response.json()) as FoundUser[];

      if (!users || users.length === 0) {
        setError("No moderator found with that email.");
        return;
      }

      // Find exact email match or take first result
      const exactMatch = users.find(
        (u) => u.email.toLowerCase() === trimmed.toLowerCase(),
      );
      setFoundUser(exactMatch ?? users[0]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAssign() {
    if (!foundUser) return;

    setError(null);
    setSuccess(null);
    setIsAssigning(true);

    try {
      const response = await fetch(`/api/rooms/${roomId}/moderators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: foundUser.id }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to assign moderator.");
        return;
      }

      setSuccess(
        `${foundUser.name ?? foundUser.email} has been assigned as moderator.`,
      );
      setFoundUser(null);
      setEmail("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Moderator</DialogTitle>
          <DialogDescription>
            Enter the email of the moderator to assign to this room
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          {success ? (
            <div
              role="status"
              className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {success}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="moderator-email">Moderator Email</Label>
            <div className="flex gap-2">
              <Input
                id="moderator-email"
                type="email"
                placeholder="moderator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSearching || isAssigning}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearch}
                disabled={isSearching || isAssigning}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="h-4 w-4" aria-hidden="true" />
                )}
                Search
              </Button>
            </div>
          </div>

          {foundUser ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {foundUser.name ?? "Unnamed User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {foundUser.email}
                </p>
              </div>
              <RoleBadge role={foundUser.role} />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          {foundUser ? (
            <Button
              type="button"
              onClick={handleAssign}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Assign
                </>
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
