import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { JoinRoomCard } from "@/components/dashboard/join-room-card";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/cn";

export default async function StudentJoinPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <Link
        href="/student"
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Student Dashboard
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Join Room
        </h1>
        <p className="mt-1 text-muted-foreground">
          Enter a room code to join a study session
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <JoinRoomCard />
      </div>
    </div>
  );
}
