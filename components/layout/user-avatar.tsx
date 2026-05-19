"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";
import { getInitials } from "@/lib/utils";

type UserAvatarSize = "sm" | "md" | "lg";

type UserAvatarProps = {
  name?: string | null;
  image?: string | null;
  role?: string | null;
  size?: UserAvatarSize;
  className?: string;
};

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

const imageSizes: Record<UserAvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

export function UserAvatar({
  name,
  image,
  role,
  size = "md",
  className,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when image URL changes
  useEffect(() => {
    setHasError(false);
  }, [image]);

  const showImage = image && !hasError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-border ring-offset-2 ring-offset-background",
        sizeClasses[size],
        className,
      )}
      title={role ? `${name ?? "User"} · ${role}` : (name ?? "User")}
      aria-label={role ? `${name ?? "User"}, ${role}` : (name ?? "User")}
    >
      {showImage ? (
        <Image
          src={image}
          alt={name ? `${name}'s avatar` : "User avatar"}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
          unoptimized
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
