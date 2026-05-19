import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { StatusBadge } from "@/components/layout/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ModeratorRoomsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "MODERATOR") {
    redirect("/login");
  }

  const userId = session.user.id;

  const assignments = await prisma.roomModerator.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { participants: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Assigned Rooms
        </h1>
        <p className="mt-1 text-muted-foreground">
          Rooms you have been assigned to moderate
        </p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="No assigned rooms"
          description="You have not been assigned to any rooms yet."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map(({ room, assignedAt }) => (
            <Card key={room.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{room.title}</CardTitle>
                  <StatusBadge status={room.status} />
                </div>
                {room.topic ? (
                  <CardDescription>{room.topic}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-5">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" aria-hidden="true" />
                    Created by {room.createdBy.name ?? room.createdBy.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {room._count.participants} participant
                    {room._count.participants !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Assigned {formatDate(assignedAt)}
                  </span>
                </div>
                <Link
                  href={`/room/${room.id}`}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full",
                  )}
                >
                  Enter Room
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
