"use client";

import {
  forwardRef,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarRootProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {}

const AvatarRoot = forwardRef<HTMLDivElement, AvatarRootProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(avatarVariants({ size, className }))}
      {...props}
    />
  )
);
AvatarRoot.displayName = "AvatarRoot";

export interface AvatarImageProps
  extends ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, onError, ...props }, ref) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) return null;

    return (
      <img
        ref={ref}
        className={cn("aspect-square h-full w-full object-cover", className)}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { AvatarRoot, AvatarImage, AvatarFallback };
