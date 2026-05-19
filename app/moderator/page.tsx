import { ShieldCheck, Activity } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/stat-card";
import { StatusBadge } from "@/components/layout/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ModeratorDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const assignments = await prisma.roomModerator.findMany({
    where: { userId },
    include: {
      room: {
        select: {
          id: true,
          title: true,
          topic: true,
          status: true,
          code: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const rooms = assignments.map((a) => a.room);
  const activeRooms = rooms.filter((room) => room.status === "ACTIVE");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Moderator Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Rooms you&apos;ve been assigned to moderate.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Assigned Rooms"
          value={rooms.length}
          icon={<ShieldCheck className="h-6 w-6" />}
          description="Total assignments"
        />
        <StatCard
          title="Active Rooms"
          value={activeRooms.length}
          icon={<Activity className="h-6 w-6" />}
          description="Currently in session"
        />
      </div>

      {/* Room List */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Assigned Rooms
        </h2>
        {rooms.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No rooms assigned yet"
            description="When a mentor assigns you as a moderator for a study room, it will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
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
                  <span className="font-mono text-xs text-muted-foreground">
                    {room.code}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
