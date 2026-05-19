"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  DoorOpen,
  LogOut,
  History,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { UserAvatar } from "@/components/layout/user-avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type Role = "ADMIN" | "MENTOR" | "MODERATOR" | "STUDENT";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { label: "Rooms", href: "/admin/rooms", icon: <DoorOpen className="h-5 w-5" /> },
  ],
  MENTOR: [
    { label: "Dashboard", href: "/mentor", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "My Rooms", href: "/mentor/rooms", icon: <DoorOpen className="h-5 w-5" /> },
  ],
  MODERATOR: [
    { label: "Dashboard", href: "/moderator", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Assigned Rooms", href: "/moderator/rooms", icon: <ShieldCheck className="h-5 w-5" /> },
  ],
  STUDENT: [
    { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Join Room", href: "/student/join", icon: <GraduationCap className="h-5 w-5" /> },
    { label: "History", href: "/student/history", icon: <History className="h-5 w-5" /> },
  ],
};

type AppSidebarProps = {
  role: Role;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
};

export function AppSidebar({
  role,
  userName,
  userEmail,
  userImage,
}: AppSidebarProps) {
  const pathname = usePathname();
  const items = navItems[role];

  const isActive = (href: string) => {
    // Exact match for dashboard roots, prefix match for sub-pages
    if (href === `/${role.toLowerCase()}`) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card text-card-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          StudySpace
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar navigation">
        <ul className="space-y-1" role="list">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3 space-y-1">
        {/* Theme toggle row */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <UserAvatar
            name={userName}
            image={userImage}
            role={role}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {userName ?? "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {userEmail ?? ""}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
