import { cn } from "@/lib/cn";

type Status = "ACTIVE" | "CLOSED";

type StatusBadgeProps = {
  status: Status;
  className?: string;
};

const statusStyles: Record<Status, string> = {
  ACTIVE:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  CLOSED:
    "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        statusStyles[status],
        className,
      )}
    >
      {status === "ACTIVE" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      ) : null}
      {status.toLowerCase()}
    </span>
  );
}
