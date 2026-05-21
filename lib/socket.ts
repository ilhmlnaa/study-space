import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "./prisma";

export type SocketServer = SocketIOServer;

type RoomMapping = { roomId: string; userId: string };
type RateLimitState = { count: number; windowStart: number };

const PARTICIPANT_BROADCAST_DELAY_MS = 500;
const CHAT_RATE_LIMIT_WINDOW_MS = 5_000;
const CHAT_RATE_LIMIT_MAX_EVENTS = 5;
const WHITEBOARD_SYNC_WINDOW_MS = 1_000;
const WHITEBOARD_SYNC_MAX_EVENTS = 5;
const WHITEBOARD_MAX_PAYLOAD_BYTES = 1_500_000;
const CHAT_MAX_LENGTH = 1_000;

let io: SocketIOServer | null = null;

const socketRoomMap = new Map<string, RoomMapping>();
const participantBroadcastTimers = new Map<string, ReturnType<typeof setTimeout>>();
const chatRateLimits = new Map<string, RateLimitState>();
const whiteboardRateLimits = new Map<string, RateLimitState>();

export function getIO(): SocketIOServer | null {
  return io;
}

function isSocketInRoom(socketId: string, roomId: string, userId?: string) {
  const mapping = socketRoomMap.get(socketId);
  if (!mapping || mapping.roomId !== roomId) return false;
  if (userId && mapping.userId !== userId) return false;
  return true;
}

function checkRateLimit(
  store: Map<string, RateLimitState>,
  key: string,
  maxEvents: number,
  windowMs: number,
) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || now - current.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (current.count >= maxEvents) return false;

  current.count += 1;
  return true;
}

function getPayloadSizeBytes(data: unknown) {
  try {
    return Buffer.byteLength(JSON.stringify(data), "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function scheduleParticipantBroadcast(roomId: string) {
  const existingTimer = participantBroadcastTimers.get(roomId);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(async () => {
    participantBroadcastTimers.delete(roomId);

    try {
      const participants = await prisma.roomParticipant.findMany({
        where: { roomId, leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, image: true, role: true },
          },
        },
      });

      io!.to(roomId).emit("room:participants", {
        participants: participants.map((p) => p.user),
      });
    } catch (err) {
      console.error("[Socket] participant broadcast error", err);
    }
  }, PARTICIPANT_BROADCAST_DELAY_MS);

  participantBroadcastTimers.set(roomId, timer);
}

export function initSocketServer(httpServer: NetServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("room:join", async (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, image: true, role: true },
        });

        if (!user) return;

        socket.join(roomId);
        socketRoomMap.set(socket.id, { roomId, userId });

        await prisma.roomParticipant.upsert({
          where: { roomId_userId: { roomId, userId } },
          update: { leftAt: null },
          create: { roomId, userId },
        });

        socket.to(roomId).emit("room:user_joined", { user });
        scheduleParticipantBroadcast(roomId);
      } catch (err) {
        console.error("[Socket] room:join error", err);
      }
    });

    socket.on(
      "room:leave",
      async (data: { roomId: string; userId: string }) => {
        const { roomId, userId } = data;
        if (!isSocketInRoom(socket.id, roomId, userId)) return;

        socket.leave(roomId);
        socketRoomMap.delete(socket.id);

        try {
          await prisma.roomParticipant.updateMany({
            where: { roomId, userId },
            data: { leftAt: new Date() },
          });

          socket.to(roomId).emit("room:user_left", { userId });
          scheduleParticipantBroadcast(roomId);
        } catch (err) {
          console.error("[Socket] room:leave error", err);
        }
      },
    );

    socket.on(
      "chat:send",
      async (data: { roomId: string; userId: string; message: string }) => {
        const { roomId, userId } = data;
        const message = data.message?.trim();

        if (!isSocketInRoom(socket.id, roomId, userId)) return;
        if (!message || message.length > CHAT_MAX_LENGTH) return;
        if (
          !checkRateLimit(
            chatRateLimits,
            socket.id,
            CHAT_RATE_LIMIT_MAX_EVENTS,
            CHAT_RATE_LIMIT_WINDOW_MS,
          )
        ) {
          socket.emit("chat:error", { message: "You are sending messages too fast." });
          return;
        }

        try {
          const room = await prisma.room.findUnique({
            where: { id: roomId },
            select: { status: true },
          });
          if (!room || room.status !== "ACTIVE") return;

          const saved = await prisma.message.create({
            data: { roomId, userId, content: message },
            include: {
              user: {
                select: { id: true, name: true, image: true, role: true },
              },
            },
          });

          io!.to(roomId).emit("chat:new", { message: saved });
        } catch (err) {
          console.error("[Socket] chat:send error", err);
        }
      },
    );

    socket.on(
      "whiteboard:sync",
      (data: {
        roomId: string;
        elements: unknown[];
        appState?: unknown;
        files?: unknown;
      }) => {
        if (!isSocketInRoom(socket.id, data.roomId)) return;
        if (!Array.isArray(data.elements)) return;
        if (
          !checkRateLimit(
            whiteboardRateLimits,
            socket.id,
            WHITEBOARD_SYNC_MAX_EVENTS,
            WHITEBOARD_SYNC_WINDOW_MS,
          )
        ) {
          return;
        }
        if (getPayloadSizeBytes(data) > WHITEBOARD_MAX_PAYLOAD_BYTES) return;

        socket.to(data.roomId).emit("whiteboard:update", data);
      },
    );

    socket.on(
      "whiteboard:save",
      async (data: {
        roomId: string;
        elements: unknown[];
        appState?: unknown;
        files?: unknown;
      }) => {
        const { roomId, elements, appState, files } = data;
        if (!isSocketInRoom(socket.id, roomId)) return;
        if (!Array.isArray(elements)) return;

        try {
          const snapshotData = {
            elements,
            appState,
            files,
          } as unknown as object;
          await prisma.whiteboardSnapshot.upsert({
            where: { roomId },
            update: { data: snapshotData as never },
            create: { roomId, data: snapshotData as never },
          });
        } catch (err) {
          console.error("[Socket] whiteboard:save error", err);
        }
      },
    );

    socket.on("whiteboard:clear", async (data: { roomId: string }) => {
      const { roomId } = data;
      if (!isSocketInRoom(socket.id, roomId)) return;

      try {
        const emptyData = {
          elements: [],
          appState: {},
          files: {},
        } as unknown as object;
        await prisma.whiteboardSnapshot.upsert({
          where: { roomId },
          update: { data: emptyData as never },
          create: { roomId, data: emptyData as never },
        });
        io!.to(roomId).emit("whiteboard:cleared", { roomId });
      } catch (err) {
        console.error("[Socket] whiteboard:clear error", err);
      }
    });

    socket.on(
      "whiteboard:permission:update",
      (data: { roomId: string; permission: string }) => {
        if (!isSocketInRoom(socket.id, data.roomId)) return;
        io!.to(data.roomId).emit("whiteboard:permission:changed", data);
      },
    );

    socket.on("poll:create", (data: { roomId: string; poll: unknown }) => {
      if (!isSocketInRoom(socket.id, data.roomId)) return;
      io!.to(data.roomId).emit("poll:new", { poll: data.poll });
    });

    socket.on(
      "poll:vote",
      (data: { roomId: string; pollId: string; result: unknown }) => {
        if (!isSocketInRoom(socket.id, data.roomId)) return;
        io!.to(data.roomId).emit("poll:result", { poll: data.result });
      },
    );

    socket.on("poll:close", (data: { roomId: string; pollId: string }) => {
      if (!isSocketInRoom(socket.id, data.roomId)) return;
      io!.to(data.roomId).emit("poll:closed", data);
    });

    socket.on("hand:raise", (data: { roomId: string; raiseHand: unknown }) => {
      const { roomId, raiseHand } = data;
      if (!isSocketInRoom(socket.id, roomId)) return;
      io!.to(roomId).emit("hand:raised", { raiseHand });
    });

    socket.on(
      "hand:resolve",
      async (data: { roomId: string; raiseHandId: string }) => {
        const { roomId, raiseHandId } = data;
        if (!isSocketInRoom(socket.id, roomId)) return;

        try {
          await prisma.raiseHand.update({
            where: { id: raiseHandId },
            data: { isResolved: true, resolvedAt: new Date() },
          });
          io!.to(roomId).emit("hand:resolved", { raiseHandId });
        } catch (err) {
          console.error("[Socket] hand:resolve error", err);
        }
      },
    );

    socket.on(
      "announcement:send",
      (data: { roomId: string; announcement: unknown }) => {
        if (!isSocketInRoom(socket.id, data.roomId)) return;
        io!.to(data.roomId).emit("announcement:new", {
          announcement: data.announcement,
        });
      },
    );

    socket.on("disconnect", async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);

      chatRateLimits.delete(socket.id);
      whiteboardRateLimits.delete(socket.id);

      const mapping = socketRoomMap.get(socket.id);
      if (mapping) {
        const { roomId, userId } = mapping;
        socketRoomMap.delete(socket.id);

        try {
          await prisma.roomParticipant.updateMany({
            where: { roomId, userId, leftAt: null },
            data: { leftAt: new Date() },
          });

          socket.to(roomId).emit("room:user_left", { userId });
          scheduleParticipantBroadcast(roomId);
        } catch (err) {
          console.error("[Socket] disconnect cleanup error", err);
        }
      }
    });
  });

  return io;
}
