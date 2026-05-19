import { Role } from "@prisma/client";

export type RoomPermissionCheck = {
  userId: string;
  userRole: Role;
  roomCreatorId: string;
  roomModeratorIds: string[];
};

export function canManageRoom(check: RoomPermissionCheck): boolean {
  return check.userRole === "ADMIN" || check.userId === check.roomCreatorId;
}

export function canCloseRoom(check: RoomPermissionCheck): boolean {
  return check.userId === check.roomCreatorId;
}

export function canAssignModerator(check: RoomPermissionCheck): boolean {
  return check.userId === check.roomCreatorId;
}

export function canSendAnnouncement(check: RoomPermissionCheck): boolean {
  return (
    check.userId === check.roomCreatorId ||
    check.roomModeratorIds.includes(check.userId)
  );
}

export function canCreatePoll(check: RoomPermissionCheck): boolean {
  return check.userId === check.roomCreatorId;
}

export function canClosePoll(check: RoomPermissionCheck): boolean {
  return (
    check.userId === check.roomCreatorId ||
    check.roomModeratorIds.includes(check.userId)
  );
}

export function canResolveRaiseHand(check: RoomPermissionCheck): boolean {
  return (
    check.userId === check.roomCreatorId ||
    check.roomModeratorIds.includes(check.userId)
  );
}

export type WhiteboardPermissionCheck = {
  userId: string;
  userRole: Role;
  roomCreatorId: string;
  roomModeratorIds: string[];
  whiteboardPermission: "MENTOR_ONLY" | "MENTOR_MODERATOR" | "ALL_PARTICIPANTS";
};

export function canUseWhiteboard(check: WhiteboardPermissionCheck): boolean {
  switch (check.whiteboardPermission) {
    case "MENTOR_ONLY":
      return check.userId === check.roomCreatorId;
    case "MENTOR_MODERATOR":
      return (
        check.userId === check.roomCreatorId ||
        check.roomModeratorIds.includes(check.userId)
      );
    case "ALL_PARTICIPANTS":
      return true;
    default:
      return false;
  }
}

export function canClearWhiteboard(check: RoomPermissionCheck): boolean {
  return check.userId === check.roomCreatorId;
}
