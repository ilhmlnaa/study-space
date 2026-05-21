"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import {
  useTrackToggle,
  useDisconnectButton,
  useRoomContext,
  useMediaDevices,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  Loader2,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  Settings,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectRoot } from "@/components/ui/select";
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
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-1.5 h-9 px-3 sm:h-10 sm:px-4"
      title={enabled ? enabledLabel : disabledLabel}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : enabled ? (
        enabledIcon
      ) : (
        disabledIcon
      )}
      <span className="hidden sm:inline text-xs font-medium">
        {enabled ? enabledLabel : disabledLabel}
      </span>
    </Button>
  );
}

function DeviceSettingsPanel({ onClose }: { onClose: () => void }) {
  const room = useRoomContext();
  const cameras = useMediaDevices({ kind: "videoinput" });
  const microphones = useMediaDevices({ kind: "audioinput" });
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  async function handleCameraChange(deviceId: string) {
    try {
      await room.switchActiveDevice("videoinput", deviceId);
    } catch (err) {
      console.error("Failed to switch camera:", err);
    }
  }

  async function handleMicChange(deviceId: string) {
    try {
      await room.switchActiveDevice("audioinput", deviceId);
    } catch (err) {
      console.error("Failed to switch microphone:", err);
    }
  }

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full mb-2 right-0 z-50 w-72 rounded-lg border bg-card p-4 shadow-lg"
    >
      <p className="mb-3 text-sm font-semibold">Device Settings</p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="settings-camera"
            className="flex items-center gap-1.5 text-xs"
          >
            <Video className="h-3.5 w-3.5" />
            Camera
          </Label>
          <SelectRoot
            id="settings-camera"
            onChange={(e) => handleCameraChange(e.target.value)}
          >
            {cameras.length === 0 ? (
              <option value="">No camera found</option>
            ) : (
              cameras.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))
            )}
          </SelectRoot>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="settings-mic"
            className="flex items-center gap-1.5 text-xs"
          >
            <Mic className="h-3.5 w-3.5" />
            Microphone
          </Label>
          <SelectRoot
            id="settings-mic"
            onChange={(e) => handleMicChange(e.target.value)}
          >
            {microphones.length === 0 ? (
              <option value="">No microphone found</option>
            ) : (
              microphones.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Mic ${device.deviceId.slice(0, 8)}`}
                </option>
              ))
            )}
          </SelectRoot>
        </div>
      </div>
    </div>
  );
}

export function VideoControlBar({ className }: VideoControlBarProps) {
  const [showSettings, setShowSettings] = useState(false);

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
        "relative flex items-center justify-center gap-1.5 sm:gap-2 border-t bg-card px-3 py-2.5 sm:px-4 sm:py-3",
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
        disabledLabel="Off"
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

      {/* Settings button */}
      <div className="relative">
        <Button
          variant={showSettings ? "secondary" : "outline"}
          onClick={() => setShowSettings((v) => !v)}
          className="flex items-center gap-1.5 h-9 px-3 sm:h-10 sm:px-4"
          title="Device settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">Settings</span>
        </Button>

        {showSettings && (
          <DeviceSettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </div>

      {/* Leave button */}
      <Button
        {...disconnectProps}
        variant="destructive"
        className="flex items-center gap-1.5 h-9 px-3 sm:h-10 sm:px-4"
        title="Leave call"
      >
        <Phone className="h-4 w-4 rotate-[135deg]" />
        <span className="hidden sm:inline text-xs font-medium">Leave</span>
      </Button>
    </div>
  );
}
