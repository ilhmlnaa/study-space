"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, PlusCircle } from "lucide-react";

import { createRoomSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectRoot } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FieldErrors = {
  title?: string[];
  description?: string[];
  topic?: string[];
  whiteboardPermission?: string[];
  roomMode?: string[];
  videoMaxParticipants?: string[];
  videoMode?: string[];
};

export function CreateRoomForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [whiteboardPermission, setWhiteboardPermission] =
    useState("MENTOR_ONLY");
  const [roomMode, setRoomMode] = useState<
    "WHITEBOARD_ONLY" | "VIDEO_CONFERENCE"
  >("WHITEBOARD_ONLY");
  const [videoMaxParticipants, setVideoMaxParticipants] = useState("10");
  const [videoMode, setVideoMode] = useState<"LECTURE" | "DISCUSSION">(
    "LECTURE",
  );
  const [studentCanEnableCamera, setStudentCanEnableCamera] = useState(false);
  const [studentCanEnableMic, setStudentCanEnableMic] = useState(false);
  const [studentCanShareScreen, setStudentCanShareScreen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = {
      title: title.trim(),
      description: description.trim() || undefined,
      topic: topic.trim() || undefined,
      whiteboardPermission,
      roomMode,
      videoMaxParticipants:
        roomMode === "VIDEO_CONFERENCE"
          ? Number(videoMaxParticipants)
          : undefined,
      videoMode,
      studentCanEnableCamera,
      studentCanEnableMic,
      studentCanShareScreen,
    };

    const parsed = createRoomSchema.safeParse(formData);

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = (await response.json().catch(() => null)) as {
        room?: { id: string };
        error?: string;
        details?: FieldErrors;
      } | null;

      if (!response.ok) {
        if (data?.details) {
          setFieldErrors(data.details);
        }
        setError(data?.error ?? "Failed to create room.");
        return;
      }

      const roomId = data?.room?.id;
      if (roomId) {
        router.push(`/room/${roomId}`);
      } else {
        router.push("/mentor");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Study Room</CardTitle>
        <CardDescription>Set up a new collaborative study room</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          {/* Room Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Room Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Calculus Study Group"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              aria-invalid={fieldErrors.title ? true : undefined}
              aria-describedby={fieldErrors.title ? "title-error" : undefined}
              required
            />
            {fieldErrors.title ? (
              <p id="title-error" className="text-sm text-destructive">
                {fieldErrors.title[0]}
              </p>
            ) : null}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what this study room is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
            {fieldErrors.description ? (
              <p className="text-sm text-destructive">
                {fieldErrors.description[0]}
              </p>
            ) : null}
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              Topic <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="topic"
              name="topic"
              placeholder='e.g. "Mathematics", "Physics"'
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
            {fieldErrors.topic ? (
              <p className="text-sm text-destructive">{fieldErrors.topic[0]}</p>
            ) : null}
          </div>

          {/* Room Mode */}
          <div className="space-y-2">
            <Label htmlFor="roomMode">Room Type</Label>
            <SelectRoot
              id="roomMode"
              name="roomMode"
              value={roomMode}
              onChange={(e) =>
                setRoomMode(
                  e.target.value as "WHITEBOARD_ONLY" | "VIDEO_CONFERENCE",
                )
              }
              disabled={isLoading}
            >
              <option value="WHITEBOARD_ONLY">Whiteboard Only</option>
              <option value="VIDEO_CONFERENCE">Video Conference</option>
            </SelectRoot>
            <p className="text-xs text-muted-foreground">
              {roomMode === "VIDEO_CONFERENCE"
                ? "Participants can join a live video call. Whiteboard is also available."
                : "Whiteboard, chat, polls, and other tools — no video call."}
            </p>
            {fieldErrors.roomMode ? (
              <p className="text-sm text-destructive">
                {fieldErrors.roomMode[0]}
              </p>
            ) : null}
          </div>

          {/* Video Conference Settings */}
          {roomMode === "VIDEO_CONFERENCE" && (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Video Conference Settings</p>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label htmlFor="videoMaxParticipants">
                  Max Participants{" "}
                  <span className="text-muted-foreground">(2–50)</span>
                </Label>
                <Input
                  id="videoMaxParticipants"
                  name="videoMaxParticipants"
                  type="number"
                  min={2}
                  max={50}
                  value={videoMaxParticipants}
                  onChange={(e) => setVideoMaxParticipants(e.target.value)}
                  disabled={isLoading}
                />
                {fieldErrors.videoMaxParticipants ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.videoMaxParticipants[0]}
                  </p>
                ) : null}
              </div>

              {/* Video Mode */}
              <div className="space-y-2">
                <Label htmlFor="videoMode">Video Mode</Label>
                <SelectRoot
                  id="videoMode"
                  name="videoMode"
                  value={videoMode}
                  onChange={(e) =>
                    setVideoMode(e.target.value as "LECTURE" | "DISCUSSION")
                  }
                  disabled={isLoading}
                >
                  <option value="LECTURE">
                    Lecture — mentor presents, students watch
                  </option>
                  <option value="DISCUSSION">
                    Discussion — everyone can participate
                  </option>
                </SelectRoot>
              </div>

              {/* Student Permissions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Student Permissions
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentCanEnableMic}
                      onChange={(e) => setStudentCanEnableMic(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border"
                    />
                    Allow students to enable microphone
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentCanEnableCamera}
                      onChange={(e) =>
                        setStudentCanEnableCamera(e.target.checked)
                      }
                      disabled={isLoading}
                      className="h-4 w-4 rounded border"
                    />
                    Allow students to enable camera
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentCanShareScreen}
                      onChange={(e) =>
                        setStudentCanShareScreen(e.target.checked)
                      }
                      disabled={isLoading}
                      className="h-4 w-4 rounded border"
                    />
                    Allow students to share screen
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Whiteboard Permission */}
          <div className="space-y-2">
            <Label htmlFor="whiteboardPermission">Whiteboard Permission</Label>
            <SelectRoot
              id="whiteboardPermission"
              name="whiteboardPermission"
              value={whiteboardPermission}
              onChange={(e) => setWhiteboardPermission(e.target.value)}
              disabled={isLoading}
            >
              <option value="MENTOR_ONLY">Mentor Only</option>
              <option value="MENTOR_MODERATOR">Mentor &amp; Moderator</option>
              <option value="ALL_PARTICIPANTS">All Participants</option>
            </SelectRoot>
            {fieldErrors.whiteboardPermission ? (
              <p className="text-sm text-destructive">
                {fieldErrors.whiteboardPermission[0]}
              </p>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-3">
          <Link href="/mentor">
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Create Room
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
