import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, Users } from "lucide-react";

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

export default async function StudentHistoryPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const userId = session.user.id;

  const participations = await prisma.roomParticipant.findMany({
    where: { userId },
    include: {
      room: {
        include: { _count: { select: { participants: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Study Room History
        </h1>
        <p className="mt-1 text-muted-foreground">
          All study rooms you have joined
        </p>
      </div>

      {participations.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No rooms yet"
          description="Join a study room to see your history here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {participations.map(({ room, joinedAt }) => {
            const isActive = room.status === "ACTIVE";

            return (
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
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {room._count.participants} participant
                      {room._count.participants !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      Joined {formatDate(joinedAt)}
                    </span>
                  </div>
                  <Link
                    href={`/room/${room.id}`}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full",
                    )}
                  >
                    {isActive ? "Enter Room" : "View History"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
