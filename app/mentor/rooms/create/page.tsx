import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateRoomForm } from "@/components/dashboard/create-room-form";

export default async function CreateRoomPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "MENTOR") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/mentor"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Dashboard
      </Link>

      <CreateRoomForm />
    </div>
  );
}
