"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function JoinRoomCard() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter a room code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = (await response.json().catch(() => null)) as
        | { room?: { id: string }; error?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to join room.");
        return;
      }

      const roomId = data?.room?.id;
      if (!roomId) {
        setError("Unexpected response from server.");
        return;
      }

      router.push(`/room/${roomId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Join Room</CardTitle>
        <CardDescription>
          Enter a room code shared by your mentor to jump into a study session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <label htmlFor="room-code" className="sr-only">
              Room code
            </label>
            <Input
              id="room-code"
              name="code"
              autoComplete="off"
              spellCheck={false}
              placeholder="Enter room code (e.g. STUDY-A7K2)"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                if (error) setError(null);
              }}
              disabled={isLoading}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "room-code-error" : undefined}
            />
            {error ? (
              <p
                id="room-code-error"
                role="alert"
                className="mt-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={isLoading} className="sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Joining
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Join
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
