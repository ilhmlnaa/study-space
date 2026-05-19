"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type RoomErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RoomError({ error, reset }: RoomErrorProps) {
  useEffect(() => {
    console.error("[Room error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mb-1 text-xl font-semibold text-foreground">
          Something went wrong in this room
        </h1>
        <p className="mb-4 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading the room."}
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex flex-col items-center gap-2">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
