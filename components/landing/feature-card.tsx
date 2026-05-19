import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl",
        className
      )}
    >
      <div className="mb-5 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
