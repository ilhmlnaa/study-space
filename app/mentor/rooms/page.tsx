import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, DoorOpen } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { RoomCard } from "@/components/dashboard/room-card";

export default async function MentorRoomsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "MENTOR") {
    redirect("/login");
  }

  const rooms = await prisma.room.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { participants: true },
      },
      moderators: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Rooms
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all your study rooms
          </p>
        </div>
        <Link href="/mentor/rooms/create">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Room
          </Button>
        </Link>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={<DoorOpen className="h-6 w-6" />}
          title="No rooms yet"
          description="Create your first study room to get started."
          action={
            <Link href="/mentor/rooms/create">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create your first room
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={{
                id: room.id,
                title: room.title,
                description: room.description,
                topic: room.topic,
                code: room.code,
                status: room.status,
                whiteboardPermission: room.whiteboardPermission,
                createdAt: room.createdAt.toISOString(),
                _count: { participants: room._count.participants },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
