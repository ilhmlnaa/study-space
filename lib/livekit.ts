import { AccessToken, VideoGrant } from "livekit-server-sdk";

export const VIDEO_MAX_PARTICIPANTS_LIMIT = 50;

export type LiveKitPermissions = {
  canPublish: boolean;
  canSubscribe: boolean;
  canPublishData: boolean;
};

export type ParticipantOverrides = {
  canSpeak: boolean;
  canVideo: boolean;
};

/**
 * Get LiveKit permissions based on user role in the room.
 * For students, per-participant overrides (canSpeak/canVideo) take precedence
 * over room-level settings.
 */
export function getLiveKitPermissions(
  role: "creator" | "moderator" | "student",
  roomSettings: {
    studentCanEnableCamera: boolean;
    studentCanEnableMic: boolean;
    studentCanShareScreen: boolean;
  },
  participantOverrides?: ParticipantOverrides,
): LiveKitPermissions {
  if (role === "creator" || role === "moderator") {
    return {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };
  }

  // Students: can always subscribe and publish data (for chat etc)
  // Publishing audio/video depends on room settings OR individual permission grants
  const canPublishAudio =
    roomSettings.studentCanEnableMic ||
    (participantOverrides?.canSpeak ?? false);
  const canPublishVideo =
    roomSettings.studentCanEnableCamera ||
    (participantOverrides?.canVideo ?? false);

  return {
    canPublish: canPublishAudio || canPublishVideo,
    canSubscribe: true,
    canPublishData: true,
  };
}

/**
 * Generate a LiveKit access token for a participant.
 */
export async function generateLiveKitToken(options: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  permissions: LiveKitPermissions;
  metadata?: string;
}): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit API key or secret is not configured");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: options.participantIdentity,
    name: options.participantName,
    ttl: "6h",
    metadata: options.metadata,
  });

  const grant: VideoGrant = {
    room: options.roomName,
    roomJoin: true,
    canPublish: options.permissions.canPublish,
    canSubscribe: options.permissions.canSubscribe,
    canPublishData: options.permissions.canPublishData,
  };

  at.addGrant(grant);

  return await at.toJwt();
}
