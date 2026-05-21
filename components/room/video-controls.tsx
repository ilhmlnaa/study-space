"use client";

import type { ReactNode } from "react";
import { useTrackToggle, useDisconnectButton } from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  Loader2,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type VideoControlBarProps = {
  className?: string;
};

function ControlButton({
  enabled,
  pending,
  onClick,
  enabledIcon,
  disabledIcon,
  enabledLabel,
  disabledLabel,
  variant = "outline",
  disabledVariant = "destructive",
}: {
  enabled: boolean;
  pending: boolean;
  onClick: () => void;
  enabledIcon: ReactNode;
  disabledIcon: ReactNode;
  enabledLabel: string;
  disabledLabel: string;
  variant?: "outline" | "default" | "destructive" | "secondary" | "ghost";
  disabledVariant?:
    | "outline"
    | "default"
    | "destructive"
    | "secondary"
    | "ghost";
}) {
  return (
    <Button
      variant={enabled ? variant : disabledVariant}
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="flex flex-col items-center gap-0.5 h-auto py-2 px-3 min-w-[56px]"
      title={enabled ? enabledLabel : disabledLabel}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : enabled ? (
        enabledIcon
      ) : (
        disabledIcon
      )}
      <span className="text-[10px] font-medium leading-none">
        {enabled ? enabledLabel : disabledLabel}
      </span>
    </Button>
  );
}

export function VideoControlBar({ className }: VideoControlBarProps) {
  const {
    toggle: toggleMic,
    enabled: micEnabled,
    pending: micPending,
  } = useTrackToggle({ source: Track.Source.Microphone });

  const {
    toggle: toggleCamera,
    enabled: cameraEnabled,
    pending: cameraPending,
  } = useTrackToggle({ source: Track.Source.Camera });

  const {
    toggle: toggleScreenShare,
    enabled: screenShareEnabled,
    pending: screenSharePending,
  } = useTrackToggle({ source: Track.Source.ScreenShare });

  const { buttonProps: disconnectProps } = useDisconnectButton({});

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 border-t bg-card px-4 py-3",
        className,
      )}
    >
      <ControlButton
        enabled={micEnabled}
        pending={micPending}
        onClick={() => toggleMic()}
        enabledIcon={<Mic className="h-4 w-4" />}
        disabledIcon={<MicOff className="h-4 w-4" />}
        enabledLabel="Mic"
        disabledLabel="Muted"
        variant="outline"
        disabledVariant="destructive"
      />

      <ControlButton
        enabled={cameraEnabled}
        pending={cameraPending}
        onClick={() => toggleCamera()}
        enabledIcon={<Video className="h-4 w-4" />}
        disabledIcon={<VideoOff className="h-4 w-4" />}
        enabledLabel="Camera"
        disabledLabel="Camera off"
        variant="outline"
        disabledVariant="destructive"
      />

      <ControlButton
        enabled={screenShareEnabled}
        pending={screenSharePending}
        onClick={() => toggleScreenShare()}
        enabledIcon={<Monitor className="h-4 w-4" />}
        disabledIcon={<MonitorOff className="h-4 w-4" />}
        enabledLabel="Sharing"
        disabledLabel="Share"
        variant="secondary"
        disabledVariant="outline"
      />

      <Button
        {...disconnectProps}
        variant="destructive"
        size="sm"
        className="flex flex-col items-center gap-0.5 h-auto py-2 px-3 min-w-[56px]"
        title="Leave call"
      >
        <Phone className="h-4 w-4 rotate-[135deg]" />
        <span className="text-[10px] font-medium leading-none">Leave</span>
      </Button>
    </div>
  );
}
