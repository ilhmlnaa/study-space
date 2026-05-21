"use client";

import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type VideoConferenceProps = {
  roomId: string;
  currentUser: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
  isCreator: boolean;
  isModerator: boolean;
  isReadOnly: boolean;
};

export function VideoConferencePanel({
  roomId,
  currentUser: _currentUser,
  isCreator,
  isModerator,
  isReadOnly,
}: VideoConferenceProps) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinVideoRoom = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}/video-token`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          (data as { error?: string })?.error ?? "Failed to get video token",
        );
      }

      const data = (await response.json()) as { url: string; token: string };
      setUrl(data.url);
      setToken(data.token);
      setIsJoined(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to join video room",
      );
    } finally {
      setIsConnecting(false);
    }
  }, [roomId]);

  const handleDisconnected = useCallback(() => {
    setIsJoined(false);
    setToken(null);
    setUrl(null);
  }, []);

  if (isReadOnly) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <VideoOff className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">
            Video conference is not available in read-only mode.
          </p>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Video Conference</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Join the video call to collaborate with participants
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <Button
            onClick={joinVideoRoom}
            disabled={isConnecting}
            size="lg"
            className="gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Join Video Call
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full [&_.lk-video-conference]:h-full"
      data-lk-theme="default"
    >
      <LiveKitRoom
        serverUrl={url!}
        token={token!}
        connect={true}
        video={isCreator || isModerator}
        audio={isCreator || isModerator}
        onDisconnected={handleDisconnected}
        onError={(err) => {
          console.error("LiveKit error:", err);
          setError(err.message);
        }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
