"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectRoot } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WhiteboardPermission =
  | "MENTOR_ONLY"
  | "MENTOR_MODERATOR"
  | "ALL_PARTICIPANTS";

type EditRoomDialogProps = {
  roomId: string;
  initialData: {
    title: string;
    description: string | null;
    topic: string | null;
    whiteboardPermission: WhiteboardPermission;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditRoomDialog({
  roomId,
  initialData,
  open,
  onOpenChange,
}: EditRoomDialogProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description ?? "");
  const [topic, setTopic] = useState(initialData.topic ?? "");
  const [permission, setPermission] = useState<WhiteboardPermission>(
    initialData.whiteboardPermission,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          topic: topic.trim() || undefined,
          whiteboardPermission: permission,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { error?: string })?.error ?? "Failed to update room.");
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update room details and whiteboard permission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <p
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                required
                minLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-topic">Topic</Label>
              <Input
                id="edit-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Mathematics"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-permission">Whiteboard Permission</Label>
              <SelectRoot
                id="edit-permission"
                value={permission}
                onChange={(e) =>
                  setPermission(e.target.value as WhiteboardPermission)
                }
                disabled={loading}
              >
                <option value="MENTOR_ONLY">Mentor Only</option>
                <option value="MENTOR_MODERATOR">Mentor &amp; Moderator</option>
                <option value="ALL_PARTICIPANTS">All Participants</option>
              </SelectRoot>
              <p className="text-xs text-muted-foreground">
                Controls who can draw on the room whiteboard.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
