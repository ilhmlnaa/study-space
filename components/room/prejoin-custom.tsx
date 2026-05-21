"use client";

import { useEffect, useRef, useState } from "react";
import { usePreviewDevice, useMediaDevices } from "@livekit/components-react";
import type { LocalVideoTrack } from "livekit-client";
import {
  Camera,
  CameraOff,
  Loader2,
  Mic,
  MicOff,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectRoot } from "@/components/ui/select";

type PreJoinCustomProps = {
  defaultUsername: string;
  defaultVideoEnabled: boolean;
  defaultAudioEnabled: boolean;
  isConnecting: boolean;
  error: string | null;
  onSubmit: (choices: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    videoDeviceId: string;
    audioDeviceId: string;
  }) => void;
  onCancel: () => void;
};

export function PreJoinCustom({
  defaultUsername,
  defaultVideoEnabled,
  defaultAudioEnabled,
  isConnecting,
  error,
  onSubmit,
  onCancel,
}: PreJoinCustomProps) {
  const [videoEnabled, setVideoEnabled] = useState(defaultVideoEnabled);
  const [audioEnabled, setAudioEnabled] = useState(defaultAudioEnabled);
  const [videoDeviceId, setVideoDeviceId] = useState("");
  const [audioDeviceId, setAudioDeviceId] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);

  // Get device lists
  const cameras = useMediaDevices({ kind: "videoinput" });
  const microphones = useMediaDevices({ kind: "audioinput" });

  // Preview tracks
  const { localTrack: videoTrack } = usePreviewDevice<LocalVideoTrack>(
    videoEnabled,
    videoDeviceId,
    "videoinput",
  );

  // Attach video preview to element
  useEffect(() => {
    if (!videoRef.current) return;
    if (videoTrack) {
      videoTrack.attach(videoRef.current);
      return () => {
        videoTrack.detach();
      };
    }
  }, [videoTrack]);

  // Set default device IDs once devices are loaded
  useEffect(() => {
    if (cameras.length > 0 && !videoDeviceId) {
      setVideoDeviceId(cameras[0].deviceId);
    }
  }, [cameras, videoDeviceId]);

  useEffect(() => {
    if (microphones.length > 0 && !audioDeviceId) {
      setAudioDeviceId(microphones[0].deviceId);
    }
  }, [microphones, audioDeviceId]);

  function handleJoin() {
    onSubmit({ videoEnabled, audioEnabled, videoDeviceId, audioDeviceId });
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-auto p-4">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold">Ready to join?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your camera and microphone before joining
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Camera preview */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
          {videoEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CameraOff className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Username badge */}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
            {defaultUsername}
          </div>

          {/* Toggle buttons overlay */}
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => setAudioEnabled((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                audioEnabled
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-destructive text-white hover:bg-destructive/90"
              }`}
              title={audioEnabled ? "Mute mic" : "Unmute mic"}
            >
              {audioEnabled ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setVideoEnabled((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                videoEnabled
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-destructive text-white hover:bg-destructive/90"
              }`}
              title={videoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {videoEnabled ? (
                <Camera className="h-4 w-4" />
              ) : (
                <CameraOff className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Device selectors */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="camera-select" className="flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              Camera
            </Label>
            <SelectRoot
              id="camera-select"
              value={videoDeviceId}
              onChange={(e) => setVideoDeviceId(e.target.value)}
              disabled={!videoEnabled || cameras.length === 0}
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
            <Label htmlFor="mic-select" className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              Microphone
            </Label>
            <SelectRoot
              id="mic-select"
              value={audioDeviceId}
              onChange={(e) => setAudioDeviceId(e.target.value)}
              disabled={!audioEnabled || microphones.length === 0}
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

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="destructive"
            size="lg"
            onClick={onCancel}
            disabled={isConnecting}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleJoin}
            disabled={isConnecting}
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
    </div>
  );
}
