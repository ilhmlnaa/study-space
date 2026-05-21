"use client";

import { useState, useCallback, useEffect } from "react";
import {
  LiveKitRoom,
  CarouselLayout,
  ConnectionStateToast,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useCreateLayoutContext,
  usePinnedTracks,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomEvent, Track } from "livekit-client";
import { Mic, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreJoinCustom } from "@/components/room/prejoin-custom";
import type { Socket } from "socket.io-client";

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
  socket?: Socket | null;
};

function VideoLayout() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    {
      updateOnlyOn: [RoomEvent.ActiveSpeakersChanged],
      onlySubscribed: false,
    },
  );
  const layoutContext = useCreateLayoutContext();
  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => track !== focusTrack);

  return (
    <div className="lk-video-conference h-full w-full">
      <LayoutContextProvider value={layoutContext}>
        <div className="lk-video-conference-inner">
          {!focusTrack ? (
            <div className="lk-grid-layout-wrapper">
              <GridLayout tracks={tracks}>
                <ParticipantTile />
              </GridLayout>
            </div>
          ) : (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer>
                <CarouselLayout tracks={carouselTracks}>
                  <ParticipantTile />
                </CarouselLayout>
                <FocusLayout trackRef={focusTrack} />
              </FocusLayoutContainer>
            </div>
          )}
          <ControlBar
            controls={{
              microphone: true,
              camera: true,
              screenShare: true,
              leave: true,
              chat: false,
              settings: false,
            }}
          />
        </div>
      </LayoutContextProvider>
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}

export function VideoConferencePanel({
  roomId,
  currentUser,
  isCreator,
  isModerator,
  isReadOnly,
  socket,
}: VideoConferenceProps) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showPreJoin, setShowPreJoin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakingNotification, setSpeakingNotification] = useState<
    string | null
  >(null);

  // Prejoin state
  const [audioEnabled, setAudioEnabled] = useState(isCreator || isModerator);
  const [videoEnabled, setVideoEnabled] = useState(isCreator || isModerator);
  const [videoDeviceId, setVideoDeviceId] = useState("");
  const [audioDeviceId, setAudioDeviceId] = useState("");

  // Listen for speaking permission changes directed at this user
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleSpeakingGranted = (data: {
      userId: string;
      canSpeak: boolean;
      canVideo: boolean;
    }) => {
      if (data.userId !== currentUser.id) return;
      const msg = data.canSpeak
        ? "You have been allowed to speak. Reconnect to activate your mic."
        : "Your video permission has been updated.";
      setSpeakingNotification(msg);
      setTimeout(() => setSpeakingNotification(null), 8000);
    };

    const handleSpeakingRevoked = (data: { userId: string }) => {
      if (data.userId !== currentUser.id) return;
      setSpeakingNotification("Your speaking permission has been revoked.");
      setTimeout(() => setSpeakingNotification(null), 6000);
    };

    socket.on("speaking:granted", handleSpeakingGranted);
    socket.on("speaking:revoked", handleSpeakingRevoked);

    return () => {
      socket.off("speaking:granted", handleSpeakingGranted);
      socket.off("speaking:revoked", handleSpeakingRevoked);
    };
  }, [socket, currentUser]);

  const handleJoin = useCallback(
    async (choices: {
      videoEnabled: boolean;
      audioEnabled: boolean;
      videoDeviceId: string;
      audioDeviceId: string;
    }) => {
      setIsConnecting(true);
      setError(null);
      setAudioEnabled(choices.audioEnabled);
      setVideoEnabled(choices.videoEnabled);
      setVideoDeviceId(choices.videoDeviceId);
      setAudioDeviceId(choices.audioDeviceId);

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
    },
    [roomId],
  );

  const handleDisconnected = useCallback(() => {
    setIsJoined(false);
    setToken(null);
    setUrl(null);
    setShowPreJoin(false);
  }, []);

  if (isReadOnly) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <VideoOff className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">
            Video conference is not available in read-only mode.
          </p>
        </div>
      </div>
    );
  }

  // Initial centered call-to-action
  if (!showPreJoin && !isJoined) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Video Conference</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Preview your camera and microphone before joining
            </p>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button size="lg" onClick={() => setShowPreJoin(true)}>
            <Video className="h-4 w-4" />
            Set Up & Join
          </Button>
        </div>
      </div>
    );
  }

  // Custom prejoin screen with LiveKit device hooks and app styling
  if (showPreJoin && !isJoined) {
    return (
      <PreJoinCustom
        defaultUsername={currentUser.name ?? "Anonymous"}
        defaultVideoEnabled={isCreator || isModerator}
        defaultAudioEnabled={isCreator || isModerator}
        isConnecting={isConnecting}
        error={error}
        onSubmit={handleJoin}
        onCancel={() => {
          setShowPreJoin(false);
          setError(null);
        }}
      />
    );
  }

  // Connected: show video conference (custom layout without chat)
  return (
    <div className="relative h-full w-full" data-lk-theme="default">
      {speakingNotification && (
        <div className="absolute top-2 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-lg">
            <Mic className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-medium">{speakingNotification}</p>
          </div>
        </div>
      )}
      <LiveKitRoom
        serverUrl={url!}
        token={token!}
        connect={true}
        video={
          videoEnabled && videoDeviceId
            ? { deviceId: { exact: videoDeviceId } }
            : videoEnabled
        }
        audio={
          audioEnabled && audioDeviceId
            ? { deviceId: { exact: audioDeviceId } }
            : audioEnabled
        }
        onDisconnected={handleDisconnected}
        onError={(err) => {
          console.error("LiveKit error:", err);
          setError(err.message);
        }}
      >
        <VideoLayout />
      </LiveKitRoom>
    </div>
  );
}
