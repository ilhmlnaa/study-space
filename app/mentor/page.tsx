import Link from "next/link";
import { DoorOpen, Activity, Users, Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/stat-card";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MentorDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const rooms = await prisma.room.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  const activeRooms = rooms.filter((room) => room.status === "ACTIVE");
  const totalParticipants = rooms.reduce(
    (sum, room) => sum + room._count.participants,
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mentor Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your study rooms and track participation.
          </p>
        </div>
        <Link href="/mentor/rooms/create">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Room
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="My Rooms"
          value={rooms.length}
          icon={<DoorOpen className="h-6 w-6" />}
          description="Total rooms created"
        />
        <StatCard
          title="Active Sessions"
          value={activeRooms.length}
          icon={<Activity className="h-6 w-6" />}
          description="Currently running"
        />
        <StatCard
          title="Total Participants"
          value={totalParticipants}
          icon={<Users className="h-6 w-6" />}
          description="Across all rooms"
        />
      </div>

      {/* Room List */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          My Rooms
        </h2>
        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t created any rooms yet.
            </p>
            <Link href="/mentor/rooms/create" className="mt-4 inline-block">
              <Button variant="outline">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create your first room
              </Button>
            </Link>
          </div>
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
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {room._count.participants} participant
                      {room._count.participants !== 1 ? "s" : ""}
                    </span>
                    <span className="font-mono text-xs">{room.code}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
