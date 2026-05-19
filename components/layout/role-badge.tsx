import { cn } from "@/lib/cn";

type Role = "ADMIN" | "MENTOR" | "MODERATOR" | "STUDENT";

type RoleBadgeProps = {
  role: Role;
  className?: string;
};

const roleStyles: Record<Role, string> = {
  ADMIN: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
  MENTOR:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300",
  MODERATOR:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
  STUDENT:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        roleStyles[role],
        className,
      )}
    >
      {role.toLowerCase()}
    </span>
  );
}
