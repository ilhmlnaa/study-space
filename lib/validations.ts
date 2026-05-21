import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    role: z
      .enum(["STUDENT", "MENTOR", "MODERATOR"])
      .optional()
      .default("STUDENT"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const createRoomSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    description: z.string().optional(),
    topic: z.string().optional(),
    whiteboardPermission: z
      .enum(["MENTOR_ONLY", "MENTOR_MODERATOR", "ALL_PARTICIPANTS"])
      .default("MENTOR_ONLY"),
    roomMode: z
      .enum(["WHITEBOARD_ONLY", "VIDEO_CONFERENCE"])
      .default("WHITEBOARD_ONLY"),
    videoMaxParticipants: z.coerce
      .number()
      .int()
      .min(2, "Minimum 2 participants.")
      .max(50, "Maximum 50 participants for now.")
      .optional(),
    videoMode: z.enum(["LECTURE", "DISCUSSION"]).default("LECTURE"),
    studentCanShareScreen: z.boolean().default(false),
    studentCanEnableCamera: z.boolean().default(false),
    studentCanEnableMic: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.roomMode === "VIDEO_CONFERENCE") {
        return (
          data.videoMaxParticipants !== undefined &&
          data.videoMaxParticipants >= 2
        );
      }
      return true;
    },
    {
      message: "Video conference rooms require videoMaxParticipants (min 2).",
      path: ["videoMaxParticipants"],
    },
  );

export const updateRoomSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").optional(),
  description: z.string().optional(),
  topic: z.string().optional(),
  whiteboardPermission: z
    .enum(["MENTOR_ONLY", "MENTOR_MODERATOR", "ALL_PARTICIPANTS"])
    .optional(),
  videoMode: z.enum(["LECTURE", "DISCUSSION"]).optional(),
  videoMaxParticipants: z.coerce.number().int().min(2).max(50).optional(),
  studentCanShareScreen: z.boolean().optional(),
  studentCanEnableCamera: z.boolean().optional(),
  studentCanEnableMic: z.boolean().optional(),
});

export const joinRoomSchema = z.object({
  code: z.string().min(4, "Room code is required."),
});

export const createPollSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters."),
  options: z
    .array(z.string().min(1, "Option cannot be empty."))
    .min(2, "Poll must have at least 2 options."),
});

export const votePollSchema = z.object({
  optionId: z.string().min(1, "Option is required."),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty."),
});

export const createAnnouncementSchema = z.object({
  content: z.string().min(1, "Announcement cannot be empty."),
});

export const updateWhiteboardPermissionSchema = z.object({
  whiteboardPermission: z.enum([
    "MENTOR_ONLY",
    "MENTOR_MODERATOR",
    "ALL_PARTICIPANTS",
  ]),
});

export const saveWhiteboardSnapshotSchema = z.object({
  roomId: z.string().min(1, "Room ID is required."),
  elements: z.array(z.any()),
  appState: z.record(z.string(), z.any()).optional(),
  files: z.record(z.string(), z.any()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type CreatePollInput = z.infer<typeof createPollSchema>;
export type VotePollInput = z.infer<typeof votePollSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateWhiteboardPermissionInput = z.infer<
  typeof updateWhiteboardPermissionSchema
>;
export type SaveWhiteboardSnapshotInput = z.infer<
  typeof saveWhiteboardSnapshotSchema
>;
