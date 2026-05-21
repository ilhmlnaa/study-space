"use client";

import { useState } from "react";
import {
  Loader2,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  UserPlus,
  Video,
} from "lucide-react";
import type { Socket } from "socket.io-client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectRoot } from "@/components/ui/select";
import { UserAvatar } from "@/components/layout/user-avatar";
import { RoleBadge } from "@/components/layout/role-badge";

type WhiteboardPermission =
  | "MENTOR_ONLY"
  | "MENTOR_MODERATOR"
  | "ALL_PARTICIPANTS";

type Moderator = {
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
};

type SettingsPanelProps = {
  roomId: string;
  isCreator: boolean;
  isReadOnly: boolean;
  whiteboardPermission: WhiteboardPermission;
  onWhiteboardPermissionChange: (permission: WhiteboardPermission) => void;
  moderators: Moderator[];
  socket: Socket | null;
  isVideoConference: boolean;
  studentCanEnableMic: boolean;
  studentCanEnableCamera: boolean;
  studentCanShareScreen: boolean;
};

export function SettingsPanel({
  roomId,
  isCreator,
  isReadOnly,
  whiteboardPermission,
  onWhiteboardPermissionChange,
  moderators: initialModerators,
  socket,
  isVideoConference,
  studentCanEnableMic: initialMic,
  studentCanEnableCamera: initialCamera,
  studentCanShareScreen: initialScreen,
}: SettingsPanelProps) {
  const [savingPermission, setSavingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [moderators, setModerators] = useState(initialModerators);
  const [moderatorEmail, setModeratorEmail] = useState("");
  const [searchingModerator, setSearchingModerator] = useState(false);
  const [moderatorMessage, setModeratorMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [studentCanEnableMic, setStudentCanEnableMic] = useState(initialMic);
  const [studentCanEnableCamera, setStudentCanEnableCamera] =
    useState(initialCamera);
  const [studentCanShareScreen, setStudentCanShareScreen] =
    useState(initialScreen);
  const [savingVideoSettings, setSavingVideoSettings] = useState(false);

  if (!isCreator) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center text-sm text-muted-foreground">
          <Shield className="mx-auto mb-2 h-8 w-8 opacity-40" />
          Only the room creator can access settings.
        </div>
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center text-sm text-muted-foreground">
          Settings are disabled in read-only mode.
        </div>
      </div>
    );
  }

  async function handlePermissionChange(value: WhiteboardPermission) {
    setSavingPermission(true);
    setPermissionError(null);

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whiteboardPermission: value }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to update permission");
      }

      onWhiteboardPermissionChange(value);
      socket?.emit("whiteboard:permission:update", {
        roomId,
        permission: value,
      });
    } catch (err) {
      setPermissionError(
        err instanceof Error ? err.message : "Failed to update permission",
      );
    } finally {
      setSavingPermission(false);
    }
  }

  async function handleAddModerator() {
    const trimmed = moderatorEmail.trim();
    if (!trimmed) {
      setModeratorMessage({ type: "error", text: "Please enter an email." });
      return;
    }

    setSearchingModerator(true);
    setModeratorMessage(null);

    try {
      const userRes = await fetch(
        `/api/users?role=MODERATOR&search=${encodeURIComponent(trimmed)}`,
      );
      if (!userRes.ok) throw new Error("Failed to search user");

      const users = (await userRes.json()) as Array<{
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        role: string;
      }>;

      const target =
        users.find((u) => u.email.toLowerCase() === trimmed.toLowerCase()) ??
        users[0];

      if (!target) {
        setModeratorMessage({
          type: "error",
          text: "No moderator found with that email.",
        });
        return;
      }

      const assignRes = await fetch(`/api/rooms/${roomId}/moderators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id }),
      });

      const assignData = (await assignRes.json().catch(() => null)) as {
        error?: string;
        moderator?: Moderator;
      } | null;

      if (!assignRes.ok) {
        throw new Error(assignData?.error ?? "Failed to assign moderator");
      }

      if (assignData?.moderator) {
        setModerators((prev) => [...prev, assignData.moderator!]);
      }
      setModeratorEmail("");
      setModeratorMessage({
        type: "success",
        text: `${target.name ?? target.email} added as moderator.`,
      });
    } catch (err) {
      setModeratorMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to add moderator",
      });
    } finally {
      setSearchingModerator(false);
    }
  }

  async function handleRemoveModerator(userId: string) {
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/rooms/${roomId}/moderators/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove moderator");
      setModerators((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleSaveVideoSettings() {
    setSavingVideoSettings(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCanEnableMic,
          studentCanEnableCamera,
          studentCanShareScreen,
        }),
      });
      if (!res.ok) throw new Error("Failed to save video settings");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingVideoSettings(false);
    }
  }

  const videoSettingsDirty =
    studentCanEnableMic !== initialMic ||
    studentCanEnableCamera !== initialCamera ||
    studentCanShareScreen !== initialScreen;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <SettingsIcon
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-foreground">
          Room Settings
        </span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <section className="space-y-2">
          <Label htmlFor="setting-whiteboard">Whiteboard Permission</Label>
          <SelectRoot
            id="setting-whiteboard"
            value={whiteboardPermission}
            onChange={(e) =>
              handlePermissionChange(e.target.value as WhiteboardPermission)
            }
            disabled={savingPermission}
          >
            <option value="MENTOR_ONLY">Mentor Only</option>
            <option value="MENTOR_MODERATOR">Mentor &amp; Moderator</option>
            <option value="ALL_PARTICIPANTS">All Participants</option>
          </SelectRoot>
          {savingPermission && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </p>
          )}
          {permissionError && (
            <p className="text-xs text-destructive">{permissionError}</p>
          )}
        </section>

        <section className="space-y-3">
          <Label>Moderators</Label>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="moderator@example.com"
                value={moderatorEmail}
                onChange={(e) => setModeratorEmail(e.target.value)}
                disabled={searchingModerator}
              />
              <Button
                type="button"
                onClick={handleAddModerator}
                disabled={searchingModerator}
                className="shrink-0"
              >
                {searchingModerator ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
            {moderatorMessage && (
              <p
                className={cn(
                  "text-xs",
                  moderatorMessage.type === "error"
                    ? "text-destructive"
                    : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {moderatorMessage.text}
              </p>
            )}
          </div>

          {moderators.length > 0 ? (
            <ul className="space-y-2">
              {moderators.map((mod) => (
                <li
                  key={mod.userId}
                  className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                >
                  <UserAvatar
                    name={mod.user.name}
                    image={mod.user.image}
                    size="sm"
                  />
                  <div className="flex flex-1 items-center gap-2 overflow-hidden">
                    <span className="truncate text-sm font-medium">
                      {mod.user.name ?? "Anonymous"}
                    </span>
                    <RoleBadge
                      role={
                        mod.user.role as
                          | "ADMIN"
                          | "MENTOR"
                          | "MODERATOR"
                          | "STUDENT"
                      }
                      className="scale-75"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveModerator(mod.userId)}
                    disabled={removingId === mod.userId}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${mod.user.name ?? "moderator"}`}
                  >
                    {removingId === mod.userId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No moderators assigned yet.
            </p>
          )}
        </section>

        {isVideoConference && (
          <section className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Video className="h-4 w-4 text-muted-foreground" />
              <Label>Student Permissions</Label>
            </div>

            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={studentCanEnableMic}
                  onChange={(e) => setStudentCanEnableMic(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                Allow students to enable microphone
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={studentCanEnableCamera}
                  onChange={(e) => setStudentCanEnableCamera(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                Allow students to enable camera
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={studentCanShareScreen}
                  onChange={(e) => setStudentCanShareScreen(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                Allow students to share screen
              </label>
            </div>

            {videoSettingsDirty && (
              <Button
                type="button"
                onClick={handleSaveVideoSettings}
                disabled={savingVideoSettings}
                size="sm"
              >
                {savingVideoSettings ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
