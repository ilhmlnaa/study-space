import { BookOpen, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/layout/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoinRoomCard } from "@/components/dashboard/join-room-card";

export default async function StudentDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const participations = await prisma.roomParticipant.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          _count: {
            select: { participants: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const allRooms = participations.map((p) => p.room);
  const activeRooms = allRooms.filter((room) => room.status === "ACTIVE");
  const closedRooms = allRooms.filter((room) => room.status === "CLOSED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Student Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Join study rooms and track your learning sessions.
        </p>
      </div>

      {/* Join Room */}
      <JoinRoomCard />

      {/* Active Sessions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Active Sessions
        </h2>
        {activeRooms.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="No active sessions"
            description="Join a room using a code from your mentor to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRooms.map((room) => (
              <Card key={room.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{room.title}</CardTitle>
                    <StatusBadge status={room.status} />
                  </div>
                  {room.topic ? (
                    <CardDescription>{room.topic}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {room._count.participants} participant
                    {room._count.participants !== 1 ? "s" : ""}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Study Room History */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Study Room History
        </h2>
        {closedRooms.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="No history yet"
            description="Completed study sessions will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closedRooms.map((room) => (
              <Card key={room.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{room.title}</CardTitle>
                    <StatusBadge status={room.status} />
                  </div>
                  {room.topic ? (
                    <CardDescription>{room.topic}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {room._count.participants} participant
                    {room._count.participants !== 1 ? "s" : ""}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
