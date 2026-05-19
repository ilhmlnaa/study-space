import {
  Users,
  DoorOpen,
  Activity,
  XCircle,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/stat-card";
import { StatusBadge } from "@/components/layout/status-badge";
import { RoleBadge } from "@/components/layout/role-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalRooms,
    activeRooms,
    closedRooms,
    totalMessages,
    recentRooms,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.room.count(),
    prisma.room.count({ where: { status: "ACTIVE" } }),
    prisma.room.count({ where: { status: "CLOSED" } }),
    prisma.message.count(),
    prisma.room.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, email: true, role: true },
        },
        _count: {
          select: { participants: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-muted-foreground">
          Platform-wide statistics and recent activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<Users className="h-6 w-6" />}
          description="Registered accounts"
        />
        <StatCard
          title="Total Rooms"
          value={totalRooms}
          icon={<DoorOpen className="h-6 w-6" />}
          description="All study rooms"
        />
        <StatCard
          title="Active Rooms"
          value={activeRooms}
          icon={<Activity className="h-6 w-6" />}
          description="Currently in session"
        />
        <StatCard
          title="Closed Rooms"
          value={closedRooms}
          icon={<XCircle className="h-6 w-6" />}
          description="Completed sessions"
        />
        <StatCard
          title="Total Messages"
          value={totalMessages}
          icon={<MessageSquare className="h-6 w-6" />}
          description="Across all rooms"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jump directly to management pages.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">Manage Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                View all registered accounts, update roles, and remove users
                from the platform.
              </p>
              <Link href="/admin/users">
                <Button size="sm" variant="outline">
                  Go to Users
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <DoorOpen className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">Manage Rooms</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Browse all study rooms, enter any session, and delete rooms from
                the platform.
              </p>
              <Link href="/admin/rooms">
                <Button size="sm" variant="outline">
                  Go to Rooms
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Rooms Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Rooms
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Creator</th>
                <th className="px-6 py-3 font-medium">Participants</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentRooms.map((room) => (
                <tr
                  key={room.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {room.title}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={room.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">
                        {room.createdBy.name ?? room.createdBy.email}
                      </span>
                      <RoleBadge role={room.createdBy.role} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {room._count.participants}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(room.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {recentRooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No rooms created yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
