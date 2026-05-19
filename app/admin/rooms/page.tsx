import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRoomsClient } from "@/components/dashboard/admin-rooms-client";

export default async function AdminRoomsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const rooms = await prisma.room.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          participants: true,
          messages: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AdminRoomsClient initialRooms={rooms} />;
}
