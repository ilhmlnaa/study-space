import { AccessToken, VideoGrant } from "livekit-server-sdk";

export const VIDEO_MAX_PARTICIPANTS_LIMIT = 50;

export type LiveKitPermissions = {
  canPublish: boolean;
  canSubscribe: boolean;
  canPublishData: boolean;
};

/**
 * Get LiveKit permissions based on user role in the room.
 */
export function getLiveKitPermissions(role: "creator" | "moderator" | "student", roomSettings: {
  studentCanEnableCamera: boolean;
  studentCanEnableMic: boolean;
  studentCanShareScreen: boolean;
}): LiveKitPermissions {
  if (role === "creator" || role === "moderator") {
    return {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };
  }

  // Students: can always subscribe, publish data (for chat etc)
  // but camera/mic depends on room settings
  return {
    canPublish: roomSettings.studentCanEnableCamera || roomSettings.studentCanEnableMic,
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
