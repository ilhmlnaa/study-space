import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: ReactNode;
  className?: string;
};

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      {(description || trend) ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {description ? <span>{description}</span> : null}
          {trend ? <span>{trend}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
