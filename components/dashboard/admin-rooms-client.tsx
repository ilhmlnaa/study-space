"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Trash2, LogIn } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/layout/role-badge";
import { StatusBadge } from "@/components/layout/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";

type RoomStatus = "ACTIVE" | "CLOSED";

type RoomCreator = {
  name: string | null;
  email: string;
  role: "ADMIN" | "MENTOR" | "MODERATOR" | "STUDENT";
};

type AdminRoom = {
  id: string;
  title: string;
  code: string;
  status: RoomStatus;
  topic: string | null;
  createdAt: Date | string;
  createdBy: RoomCreator;
  _count: {
    participants: number;
    messages: number;
  };
};

type StatusFilter = "ALL" | RoomStatus;

type AdminRoomsClientProps = {
  initialRooms: AdminRoom[];
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
];

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminRoomsClient({ initialRooms }: AdminRoomsClientProps) {
  const [rooms, setRooms] = useState<AdminRoom[]>(initialRooms);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rooms.filter((room) => {
      if (statusFilter !== "ALL" && room.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      const title = room.title.toLowerCase();
      const code = room.code.toLowerCase();
      return title.includes(query) || code.includes(query);
    });
  }, [rooms, searchQuery, statusFilter]);

  async function handleDelete(room: AdminRoom) {
    setError(null);
    setDeletingId(room.id);

    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Failed to delete room.");
        return;
      }

      setRooms((current) => current.filter((r) => r.id !== room.id));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Manage Rooms
        </h1>
        <p className="mt-1 text-muted-foreground">
          View, enter, or remove study rooms from the platform.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by title or code"
            className="pl-9"
            aria-label="Search rooms"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredRooms.length} {filteredRooms.length === 1 ? "room" : "rooms"}{" "}
        found
      </p>

      {filteredRooms.length === 0 ? (
        <EmptyState
          title="No rooms found"
          description="Try adjusting your search or status filter to find the room you are looking for."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Creator</th>
                  <th className="px-6 py-3 font-medium">Participants</th>
                  <th className="px-6 py-3 font-medium">Messages</th>
                  <th className="px-6 py-3 font-medium">Created At</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => {
                  const isDeleting = deletingId === room.id;
                  return (
                    <tr
                      key={room.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {room.title}
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                          {room.code}
                        </code>
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
                        {room._count.messages}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(room.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/room/${room.id}`}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label={`Enter room ${room.title}`}
                            >
                              <LogIn aria-hidden="true" className="h-4 w-4" />
                              Enter
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setPendingDelete(room)}
                            disabled={isDeleting}
                            aria-label={`Delete room ${room.title}`}
                          >
                            {isDeleting ? (
                              <Loader2
                                aria-hidden="true"
                                className="h-4 w-4 animate-spin"
                              />
                            ) : (
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete room"
        description={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.title}"? All messages, participants, and related data will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (pendingDelete) {
            await handleDelete(pendingDelete);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
