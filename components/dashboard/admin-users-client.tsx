"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/layout/role-badge";
import { UserAvatar } from "@/components/layout/user-avatar";
import { EmptyState } from "@/components/layout/empty-state";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";

type Role = "ADMIN" | "MENTOR" | "MODERATOR" | "STUDENT";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
  createdAt: Date | string;
};

type RoleFilter = "ALL" | Role;

type AdminUsersClientProps = {
  initialUsers: AdminUser[];
};

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ADMIN", label: "Admin" },
  { value: "MENTOR", label: "Mentor" },
  { value: "MODERATOR", label: "Moderator" },
  { value: "STUDENT", label: "Student" },
];

const ROLE_OPTIONS: Role[] = ["ADMIN", "MENTOR", "MODERATOR", "STUDENT"];

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      if (!query) return true;

      const name = (user.name ?? "").toLowerCase();
      const email = user.email.toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [users, searchQuery, roleFilter]);

  async function handleRoleChange(user: AdminUser, nextRole: Role) {
    if (user.role === nextRole) return;

    setError(null);
    setUpdatingId(user.id);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Failed to update user role.");
        return;
      }

      setUsers((current) =>
        current.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)),
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    setError(null);
    setDeletingId(user.id);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Failed to delete user.");
        return;
      }

      setUsers((current) => current.filter((u) => u.id !== user.id));
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
          Manage Users
        </h1>
        <p className="mt-1 text-muted-foreground">
          Update roles or remove user accounts from the platform.
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
            placeholder="Search by name or email"
            className="pl-9"
            aria-label="Search users"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((filter) => {
            const active = roleFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setRoleFilter(filter.value)}
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
        {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}{" "}
        found
      </p>

      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try adjusting your search or role filter to find the user you are looking for."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Created At</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isUpdating = updatingId === user.id;
                  const isDeleting = deletingId === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={user.name}
                            image={user.image}
                            role={user.role}
                            size="sm"
                          />
                          <span className="font-medium text-foreground">
                            {user.name ?? "Unnamed user"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <select
                              value={user.role}
                              onChange={(event) =>
                                handleRoleChange(
                                  user,
                                  event.target.value as Role,
                                )
                              }
                              disabled={isUpdating || isDeleting}
                              aria-label={`Change role for ${user.name ?? user.email}`}
                              className={cn(
                                "h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                              )}
                            >
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                  {role.charAt(0) + role.slice(1).toLowerCase()}
                                </option>
                              ))}
                            </select>
                            {isUpdating ? (
                              <Loader2
                                aria-hidden="true"
                                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                              />
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setPendingDelete(user)}
                            disabled={isUpdating || isDeleting}
                            aria-label={`Delete ${user.name ?? user.email}`}
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
        title="Delete user"
        description={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.name ?? pendingDelete.email}? This action cannot be undone.`
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
