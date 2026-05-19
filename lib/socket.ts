import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "./prisma";

export type SocketServer = SocketIOServer;

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
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

    // Join room
    socket.on("room:join", async (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      socket.join(roomId);

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, image: true, role: true },
        });

        if (user) {
          // Update leftAt to null (re-joining)
          await prisma.roomParticipant.upsert({
            where: { roomId_userId: { roomId, userId } },
            update: { leftAt: null },
            create: { roomId, userId },
          });

          socket.to(roomId).emit("room:user_joined", { user });

          // Send current participants list
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
        }
      } catch (err) {
        console.error("[Socket] room:join error", err);
      }
    });

    // Leave room
    socket.on(
      "room:leave",
      async (data: { roomId: string; userId: string }) => {
        const { roomId, userId } = data;
        socket.leave(roomId);

        try {
          await prisma.roomParticipant.updateMany({
            where: { roomId, userId },
            data: { leftAt: new Date() },
          });

          socket.to(roomId).emit("room:user_left", { userId });

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
          console.error("[Socket] room:leave error", err);
        }
      },
    );

    // Chat
    socket.on(
      "chat:send",
      async (data: { roomId: string; userId: string; message: string }) => {
        const { roomId, userId, message } = data;

        try {
          const room = await prisma.room.findUnique({ where: { id: roomId } });
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

    // Whiteboard sync
    socket.on(
      "whiteboard:sync",
      (data: {
        roomId: string;
        elements: unknown[];
        appState?: unknown;
        files?: unknown;
      }) => {
        socket.to(data.roomId).emit("whiteboard:update", data);
      },
    );

    // Whiteboard save (debounced on client side)
    socket.on(
      "whiteboard:save",
      async (data: {
        roomId: string;
        elements: unknown[];
        appState?: unknown;
        files?: unknown;
      }) => {
        const { roomId, elements, appState, files } = data;
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

    // Whiteboard clear
    socket.on("whiteboard:clear", async (data: { roomId: string }) => {
      const { roomId } = data;
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

    // Whiteboard permission update
    socket.on(
      "whiteboard:permission:update",
      (data: { roomId: string; permission: string }) => {
        io!.to(data.roomId).emit("whiteboard:permission:changed", data);
      },
    );

    // Poll create
    socket.on("poll:create", (data: { roomId: string; poll: unknown }) => {
      io!.to(data.roomId).emit("poll:new", { poll: data.poll });
    });

    // Poll vote
    socket.on(
      "poll:vote",
      (data: { roomId: string; pollId: string; result: unknown }) => {
        io!.to(data.roomId).emit("poll:result", data);
      },
    );

    // Poll close
    socket.on("poll:close", (data: { roomId: string; pollId: string }) => {
      io!.to(data.roomId).emit("poll:closed", data);
    });

    // Raise hand
    socket.on(
      "hand:raise",
      async (data: { roomId: string; userId: string }) => {
        const { roomId, userId } = data;
        try {
          const raiseHand = await prisma.raiseHand.create({
            data: { roomId, userId },
            include: {
              user: {
                select: { id: true, name: true, image: true, role: true },
              },
            },
          });
          io!.to(roomId).emit("hand:raised", { raiseHand });
        } catch (err) {
          console.error("[Socket] hand:raise error", err);
        }
      },
    );

    // Resolve raise hand
    socket.on(
      "hand:resolve",
      async (data: { roomId: string; raiseHandId: string }) => {
        const { roomId, raiseHandId } = data;
        try {
          const resolved = await prisma.raiseHand.update({
            where: { id: raiseHandId },
            data: { isResolved: true, resolvedAt: new Date() },
          });
          io!.to(roomId).emit("hand:resolved", { raiseHand: resolved });
        } catch (err) {
          console.error("[Socket] hand:resolve error", err);
        }
      },
    );

    // Announcement
    socket.on(
      "announcement:send",
      (data: { roomId: string; announcement: unknown }) => {
        io!.to(data.roomId).emit("announcement:new", {
          announcement: data.announcement,
        });
      },
    );

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
