import Image from "next/image";

import { cn } from "@/lib/cn";

type LogoProps = {
  size?: number;
  withText?: boolean;
  textClassName?: string;
  className?: string;
  priority?: boolean;
};

/**
 * Brand logo for StudySpace.
 *
 * Uses the static image at `/logo.png` and optionally renders the wordmark
 * next to it. Pass `size` to control the icon dimension (px). The wordmark
 * scales loosely with the icon size when `withText` is true.
 */
export function Logo({
  size = 32,
  withText = true,
  textClassName,
  className,
  priority = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="StudySpace logo"
        width={size}
        height={size}
        priority={priority}
        className="h-auto w-auto object-contain"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span
          className={cn(
            "font-bold tracking-tight text-foreground",
            textClassName,
          )}
        >
          StudySpace
        </span>
      )}
    </span>
  );
}
