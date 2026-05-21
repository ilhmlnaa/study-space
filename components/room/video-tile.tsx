"use client";

import { useMemo } from "react";
import {
  ParticipantTile,
  useTrackRefContext,
  useParticipantInfo,
  useIsSpeaking,
  TrackRefContext,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff } from "lucide-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";

import { UserAvatar } from "@/components/layout/user-avatar";
import { cn } from "@/lib/cn";

function parseMetadata(metadata: string | undefined): {
  image?: string | null;
} {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
}

function CustomTileContent() {
  const trackRef = useTrackRefContext();
  const { name, metadata, identity } = useParticipantInfo({
    participant: trackRef.participant,
  });
  const isSpeaking = useIsSpeaking(trackRef.participant);

  const meta = useMemo(() => parseMetadata(metadata), [metadata]);

  const isVideoTrack = trackRef.source === Track.Source.Camera;
  const isScreenShare = trackRef.source === Track.Source.ScreenShare;
  const hasPublication = "publication" in trackRef && trackRef.publication;
  const isMuted = hasPublication ? trackRef.publication?.isMuted : true;

  const micPublication = trackRef.participant.getTrackPublication(
    Track.Source.Microphone,
  );
  const isMicMuted = micPublication?.isMuted ?? true;

  const showVideo =
    (isVideoTrack || isScreenShare) && hasPublication && !isMuted;
  const displayName = name || identity || "Anonymous";

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-lg bg-zinc-900",
        isSpeaking && !isScreenShare && "ring-2 ring-primary",
      )}
    >
      {showVideo ? (
        isScreenShare ? (
          <VideoTrack
            trackRef={trackRef}
            className="h-full w-full object-contain"
          />
        ) : (
          <VideoTrack
            trackRef={trackRef}
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <UserAvatar
            name={displayName}
            image={meta.image ?? null}
            size="lg"
            className="ring-0 ring-offset-0"
          />
        </div>
      )}


      {/* Name + mic indicator overlay */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
        {isMicMuted ? (
          <MicOff className="h-3 w-3 text-red-400" />
        ) : (
          <Mic className="h-3 w-3 text-green-400" />
        )}
        <span className="max-w-37.5 truncate">
          {displayName}
          {isScreenShare && " (sharing)"}
        </span>
      </div>
    </div>
  );
}

type CustomParticipantTileProps = {
  trackRef?: TrackReferenceOrPlaceholder;
};

export function CustomParticipantTile({
  trackRef,
}: CustomParticipantTileProps) {
  const innerContent = (
    <ParticipantTile trackRef={trackRef} disableSpeakingIndicator={true}>
      <CustomTileContent />
    </ParticipantTile>
  );

  if (trackRef) {
    return (
      <TrackRefContext.Provider value={trackRef}>
        {innerContent}
      </TrackRefContext.Provider>
    );
  }

  return innerContent;
}
